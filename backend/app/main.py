"""FastAPI application factory.

Every module in the ``app.api`` package that defines a ``router`` attribute is
included under ``/api``. Adding an endpoint therefore needs no change here.
"""

from __future__ import annotations

import importlib
import pkgutil

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import api
from app.errors import install_error_handlers

API_PREFIX = "/api"


def _include_routers(application: FastAPI) -> None:
    """Import every ``app.api`` module and include the routers it exposes."""

    for module_info in sorted(pkgutil.iter_modules(api.__path__), key=lambda m: m.name):
        if module_info.name.startswith("_"):
            continue
        module = importlib.import_module(f"{api.__name__}.{module_info.name}")
        router = getattr(module, "router", None)
        if isinstance(router, APIRouter):
            application.include_router(router, prefix=API_PREFIX)


def create_app() -> FastAPI:
    """Build the application with error handlers, CORS and all routers."""

    application = FastAPI(title="Lunar Landing Site Navigator API", version="0.1.0")
    install_error_handlers(application)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    _include_routers(application)
    return application


app = create_app()
