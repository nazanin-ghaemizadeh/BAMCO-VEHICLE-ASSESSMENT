# BAMCO Vehicle Assessment & Durability — Gap Analysis

Date: 2026-11-01  
Baseline commit: `d8cbc604b171ddc93be916ad8a0f64490f224c81`

## Baseline audit

The current application is a static GitHub Pages application. Its case, scores, attachments, expert weights and revision history are stored in browser `localStorage`; GitHub Pages does not provide a shared database or server-side role enforcement. Existing Evaluator, Expert and Management screens and the current weighting logic remain intact.

The supplied workbook contains six sheets: `Criteria`, `DropDown List`, `Test Numbers`, `Summary`, `Test Plan`, and `Daily Plan`. `Criteria` contains 846 populated test rows, 19 engineering columns, merged category cells, and validation lists. The workbook has formulas in `Summary`, `Test Numbers`, `Test Plan`, and `Daily Plan`, but no permanent Test ID column, no explicit Driveability/Durability/Supplementary domain, no version key, and no immutable linkage between a historical result and a workbook version.

## Material gaps

| Area | Current state | Risk | Implemented direction |
|---|---|---|---|
| Test identity | Row-based references and formulas | Reordering can change meaning | Stable deterministic IDs generated from normalized engineering fields |
| Domain | Workbook is labelled as mainly Driveability | Durability results can be mixed with Driveability | Domain field with Driveability, Durability and Supplementary values |
| Applicability | Excel lists exist, but the application checklist is static | Irrelevant tests may be shown | Set-based filtering for category, body, powertrain, transmission and drive |
| Repetition | Existing checklist stores one score per item | Degradation is hidden | Independent result records with odometer, date, score, quantitative result and note |
| Planning | Workbook has a fixed 26-day source plan | 40,000 km cannot be re-planned safely | Parameterized planner with target km, days, start date, max daily km and control points |
| Historical safety | Existing JSON backup is case-level | Bank changes could overwrite interpretation | Bank version is stored separately from result records and JSON backup |
| Hosting | Static/offline | No shared multi-user synchronization or server RBAC | Keep local operation compatible; backend migration remains a separate deployment decision |
| Languages | Existing UI supports Persian/English | Chinese and technical content translation are incomplete | New layer includes FA/EN/ZH labels and marks source bank content rather than inventing translations |

## Durability engineering additions required before formal approval

The workbook currently contains useful repeatable performance checks, but it does not by itself define a validated 40,000-km durability protocol. The engineering owner should approve a durability matrix covering: initial/baseline inspection; scheduled checks; wear and dimensional change; deformation and panel gaps; fluid leaks; fastener loosening; cracks; corrosion; NVH change; assembly quality; powertrain performance; suspension and steering; braking; and electrical/charging performance.

Each durability test should have a vehicle configuration, load state, environment, route, measurement method, instrument and calibration status, repeat interval, mileage checkpoints, acceptance rule, severity classification, and corrective-action workflow. Numeric limits must come from the applicable vehicle specification, design target, supplier requirement, legal regulation or approved test standard. They must not be inferred from the current workbook.

Recommended planning checkpoints are baseline, early control, intermediate controls and final inspection. The example checkpoints 2,500 km and 5,000 km are planning candidates only and require engineering approval before becoming requirements.

## Reference set for engineering review

- UNECE WP.29 Global Technical Regulations, including UN GTR No. 22 on in-vehicle battery durability for electrified light-duty vehicles: https://unece.org/transport/standards/transport/vehicle-regulations-wp29/global-technical-regulations-gtrs
- ISO 16750-1:2023, road-vehicle environmental conditions and testing, general: https://www.iso.org/standard/77578.html
- ISO 16750-3:2023, road-vehicle environmental conditions and testing, mechanical loads: https://www.iso.org/standard/77579.html

These references are a starting point for applicability and test-method review. They are not a substitute for the vehicle-specific requirements or a signed durability test plan.

## Release boundary

The first implementation adds a backward-compatible Assessment Center, Excel import validation and preview, versioned bank storage, independent repeated results, a parameterized mileage planner, and a management mileage summary. It does not claim that a 40,000-km durability protocol or an emission grade is approved. Emission grading remains intentionally unimplemented until the governing formula and source standard are provided.
