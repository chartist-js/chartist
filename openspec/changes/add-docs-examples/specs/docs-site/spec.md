## ADDED Requirements

### Requirement: Examples gallery

The site SHALL have a gallery of every docs example in the examples package, grouped by chart type and filterable by it, with a live thumbnail and the title of each example, linking to the example's page.

#### Scenario: Filtering

- **WHEN** a visitor picks a chart type on the gallery
- **THEN** only that type's examples are shown, and the choice can be undone

### Requirement: Example pages

Each docs example SHALL have a page with its title, description, an editable live example of its functional entry, its classic entry (when it has one) for comparison, a link to the full-screen playground, and links to the previous and next example of its type.

#### Scenario: Comparing with 1.x

- **WHEN** a visitor opens an example that comes from 1.x
- **THEN** they can see the classic code that draws the same chart next to the functional code

### Requirement: Full-screen playground

The site SHALL have a full-screen playground with the editor, the live preview, errors and console output, reset, and an export to StackBlitz. It SHALL open an example by id, or any set of files encoded in the address, from the URL fragment. After the code is edited, the address SHALL follow the edits, and a share action SHALL copy it. Live examples SHALL open in this playground with their current files.

#### Scenario: Opening an example

- **WHEN** a visitor follows an example's "Open in playground" link
- **THEN** the playground opens with that example's files and renders it

#### Scenario: Sharing edited code

- **WHEN** a visitor edits the code, presses Share, and someone else opens the copied address
- **THEN** the playground opens with the edited files and renders them

#### Scenario: A broken address

- **WHEN** the code in the address can't be decoded
- **THEN** the playground says so and opens a blank chart
