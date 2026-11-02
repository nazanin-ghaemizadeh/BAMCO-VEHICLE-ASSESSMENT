# BAMCO Functional Vehicle Assessment

Independent web application at:
https://nazanin-ghaemizadeh.github.io/BAMCO-VEHICLE-ASSESSMENT/functional-vehicle-assessment/

This subsite is isolated in its own folder. The existing BAMCO Vehicle Assessment home page and evaluator application are unchanged.

## Workbook-based catalog
- Source: BAMCO_Vehicle_Assessment_Configurable_Final.xlsx
- 1,026 criteria with stable CR-XXXX identifiers
- 26 Driveability assessment days
- 462 Functional Durability criteria
- 516 Supplementary Questionnaire criteria
- 15 high-level categories
- Vehicle setup: class, body, powertrain, transmission, drivetrain, cabin, seating rows, off-road eligibility
- Adjustable durability distance and duration
- Route targets are *planning allocations*, not measured road lengths
- 5,000 km milestones and first/middle/end comparative checks

## Results and storage
- 1–10 scores, comments and optional resized image attachment per test/day
- Arithmetic mean is calculated from scored observations only
- Browser localStorage; no shared server-side database
- Export a JSON backup or CSV scoring log; JSON can be restored on another browser
- Note: large image collections may exceed local browser storage

## Maps
An inline Google Maps iframe displays the route area. The open-in-Google-Maps link provides live Google Maps directions. A full embedded directions polyline requires a configured Google Maps Embed API key.

## Validation
GitHub Actions validates the JavaScript syntax, catalog cardinalities and DOM smoke tests.

The original engineering workbook remains the reference for technical methods and acceptance criteria; route allocations and check recurrence are proposals subject to technical and safety approval.
