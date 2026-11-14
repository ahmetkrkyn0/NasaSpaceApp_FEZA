"""Height map windows: bilinear sampling and windowed reading (offline)."""

import numpy as np
import pytest

from app.terrain.dem import GridWindow, LayeredSampler, read_window
from app.terrain.projection import latlon_to_xy


def _ramp_grid():
    # 4 x 5 grid, 10 m pixels, x_min = 0, y_max = 40; value = column + 10 * row.
    rows, cols = 4, 5
    data = np.add.outer(10.0 * np.arange(rows), np.arange(cols))
    return GridWindow(data=data, x_min=0.0, y_max=40.0, resolution_m=10.0)


def test_pixel_centres_return_pixel_values():
    g = _ramp_grid()
    assert g.sample_xy(5.0, 35.0) == pytest.approx(0.0)
    assert g.sample_xy(15.0, 35.0) == pytest.approx(1.0)
    assert g.sample_xy(5.0, 25.0) == pytest.approx(10.0)


def test_bilinear_between_centres():
    g = _ramp_grid()
    assert g.sample_xy(10.0, 30.0) == pytest.approx(5.5)
    assert g.sample_xy(12.5, 35.0) == pytest.approx(0.75)


def test_outside_is_nan():
    g = _ramp_grid()
    assert np.isnan(g.sample_xy(-1.0, 35.0))
    assert np.isnan(g.sample_xy(5.0, 41.0))
    assert np.isnan(g.sample_xy(100.0, 20.0))


def test_layered_sampler_prefers_first_grid():
    x, y = latlon_to_xy(-85.0, 0.0)
    fine = GridWindow(np.full((10, 10), 1.0), x - 50.0, y + 50.0, 10.0)
    coarse = GridWindow(np.full((10, 10), 2.0), x - 5000.0, y + 5000.0, 1000.0)
    sampler = LayeredSampler([fine, coarse])
    lat_far, lon_far = -85.0, 0.05  # about 230 m east: outside the fine grid
    out = sampler(np.array([-85.0, lat_far]), np.array([0.0, lon_far]))
    assert out[0] == pytest.approx(1.0)
    assert out[1] == pytest.approx(2.0)


def test_read_window_from_local_geotiff(tmp_path):
    import rasterio
    from rasterio.transform import from_origin

    path = tmp_path / "dem.tif"
    data = np.arange(100 * 100, dtype=np.float32).reshape(100, 100)
    transform = from_origin(-500.0, 500.0, 10.0, 10.0)
    with rasterio.open(
        path, "w", driver="GTiff", width=100, height=100, count=1,
        dtype="float32", transform=transform, nodata=np.nan,
    ) as ds:
        ds.write(data, 1)

    win = read_window(str(path), 0.0, 0.0, 100.0)
    assert win.data.shape == (20, 20)
    assert win.resolution_m == 10.0
    assert win.x_min == -100.0 and win.y_max == 100.0
    # Pixel centre (5, 95) is row 40, column 50 of the full grid.
    assert win.sample_xy(5.0, 95.0) == pytest.approx(data[40, 50])


def test_read_window_is_clipped_to_the_map(tmp_path):
    import rasterio
    from rasterio.transform import from_origin

    path = tmp_path / "dem.tif"
    with rasterio.open(
        path, "w", driver="GTiff", width=50, height=50, count=1,
        dtype="float32", transform=from_origin(0.0, 500.0, 10.0, 10.0),
    ) as ds:
        ds.write(np.ones((50, 50), dtype=np.float32), 1)

    win = read_window(str(path), 0.0, 500.0, 100.0)
    assert win.data.shape == (10, 10)
    assert win.x_min == 0.0 and win.y_max == 500.0
