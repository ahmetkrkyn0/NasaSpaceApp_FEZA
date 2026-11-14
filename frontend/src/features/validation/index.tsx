import { getValidation } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { ValidationReport, ValidationRow } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { AsyncBlock, PanelHeader } from '../setup/shared';
import { STATUS_LABEL, attentionRows, countsText, diffText, expectedText, groupByTest, valueText } from './report';
import './validation.css';

/**
 * Validation panel (UC-10): summary of the stored validation report from `/api/validation`.
 * Failed, warning and skipped rows are listed first and in full; every row stays readable under
 * its test. Approximate rows (T6) are marked as comparisons, not validations (ADR-0004).
 */

function StatusTag({ status }: { status: ValidationRow['status'] }) {
  return <span className={`d-status d-status-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function RowTable({ rows, caption }: { rows: readonly ValidationRow[]; caption: string }) {
  return (
    <div className="d-table-wrap">
      <table className="d-table">
        <caption className="d-muted">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col">Expected</th>
            <th scope="col">Measured</th>
            <th scope="col">Difference</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.title}
                <span className="d-diff">{row.condition}</span>
                {row.kind === 'approximate' ? <span className="d-diff">Approximate comparison, not a validation: no threshold applies.</span> : null}
                {row.note ? <span className="d-diff">{row.note}</span> : null}
                <span className="d-diff">Source: {row.source}</span>
              </th>
              <td className="d-num">{expectedText(row)}</td>
              <td className="d-num">{valueText(row.measured, row.unit)}</td>
              <td className="d-num">{diffText(row)}</td>
              <td>
                <StatusTag status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ValidationSummary({ report }: { report: ValidationReport }) {
  const attention = attentionRows(report);
  const { summary } = report;
  return (
    <>
      <p>
        <span className="data">{summary.pass}</span> pass, <span className="data">{summary.warn}</span> warning,{' '}
        <span className="data">{summary.fail}</span> fail, <span className="data">{summary.skipped}</span> skipped,{' '}
        <span className="data">{summary.info}</span> approximate comparison.
      </p>
      <p className="d-muted">
        Report written {valueText(report.generated_utc, '')} ({report.target}). The server returns the stored report and does not rerun the
        tests.
      </p>
      {attention.length > 0 ? (
        <div className="d-section">
          <h3 className="d-section-title">Needs attention</h3>
          <RowTable rows={attention} caption="Rows that failed, gave a warning or were skipped." />
        </div>
      ) : report.rows.length > 0 ? (
        <p className="d-muted">No row failed, gave a warning or was skipped.</p>
      ) : null}
      <div className="d-section">
        <h3 className="d-section-title">All checks by test</h3>
        {report.rows.length === 0 ? <p className="d-muted">The report has no rows.</p> : null}
        {groupByTest(report).map((group) => (
          <details key={group.test} className="d-details" open={group.rows.some((r) => r.status === 'fail' || r.status === 'warn')}>
            <summary>
              <span className="data">{group.test}</span> {group.name} <span className="d-muted">({countsText(group.counts)})</span>
            </summary>
            <RowTable rows={group.rows} caption={`${group.test}: ${group.name}`} />
          </details>
        ))}
      </div>
    </>
  );
}

export default function ValidationPanel() {
  const report = useAsync((signal) => getValidation({ signal }), []);
  return (
    <section className="d-panel" aria-label="Validation">
      <PanelHeader title="Validation" />
      {getDataMode() === 'examples' ? (
        <p className="d-note d-note-example" role="note">
          Example data: a copy of the stored report from data/examples/validation.json. Add <span className="data">?data=live</span> to read
          the server's report.
        </p>
      ) : null}
      <AsyncBlock result={report}>{(data) => <ValidationSummary report={data} />}</AsyncBlock>
    </section>
  );
}
