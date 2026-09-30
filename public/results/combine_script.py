import csv
from pathlib import Path

# Configuration
RUN_FOLDER = "run2"
OUTPUT_FOLDER = "run2"

IMPLEMENTATIONS = {
    "HAND_VECTORIZED": "hand_vectorized",
    "LLVM_AUTO": "llvm_auto",
    "SCALAR": "scalar",
}

NAME_COLUMN = "name"


def read_csv(path):
    """Read a CSV into a dictionary keyed by its name column."""
    with path.open("r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        if NAME_COLUMN not in (reader.fieldnames or []):
            raise ValueError(f"Missing '{NAME_COLUMN}' column in {path}")

        rows = {}

        for row in reader:
            name = row[NAME_COLUMN]

            if name:
                rows[name] = row

        return rows


def has_value(value):
    """Return whether a CSV value is nonempty."""
    return value is not None and value.strip() != ""


def combine_csv_files(relative_path):
    """Combine matching CSV files from all implementations."""
    datasets = {}

    for folder, prefix in IMPLEMENTATIONS.items():
        path = Path(folder) / RUN_FOLDER / relative_path
        datasets[prefix] = read_csv(path)

    # Keep only names present in every implementation.
    common_names = set.intersection(
        *(set(rows.keys()) for rows in datasets.values())
    )

    if not common_names:
        print(f"Skipping {relative_path}: no common names")
        return

    # Preserve the row order from the scalar CSV.
    ordered_names = [
        name for name in datasets["scalar"]
        if name in common_names
    ]

    # Build output columns.
    output_fields = [NAME_COLUMN]
    output_data = []

    for name in ordered_names:
        output_row = {NAME_COLUMN: name}

        for prefix, rows in datasets.items():
            row = rows[name]

            for column, value in row.items():
                if column == NAME_COLUMN:
                    continue

                output_column = f"{prefix}_{column}"
                output_row[output_column] = value

        output_data.append(output_row)

    # Remove columns that are empty across all output rows.
    all_columns = list(dict.fromkeys(
        column
        for row in output_data
        for column in row
        if column != NAME_COLUMN
    ))

    nonempty_columns = [
        column
        for column in all_columns
        if any(
            has_value(row.get(column, ""))
            for row in output_data
        )
    ]

    output_fields.extend(nonempty_columns)

    # Create the output directory, preserving the hierarchy.
    output_path = (
        Path("combined") / OUTPUT_FOLDER / relative_path
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open(
        "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(
            f,
            fieldnames=output_fields,
            extrasaction="ignore",
        )
        writer.writeheader()
        writer.writerows(output_data)

    print(f"Created {output_path}")


def main():
    print("Combining CSV files from implementations:")
    # Find CSV files in the first implementation.
    reference_dir = Path("HAND_VECTORIZED") / RUN_FOLDER

    if not reference_dir.is_dir():
        raise FileNotFoundError(
            f"Run directory not found: {reference_dir}"
        )

    reference_files = {
        path.relative_to(reference_dir)
        for path in reference_dir.rglob("*.csv")
    }

    # Find files present in all three implementations.
    common_files = reference_files

    for folder in IMPLEMENTATIONS:
        run_dir = Path(folder) / RUN_FOLDER

        if not run_dir.is_dir():
            raise FileNotFoundError(
                f"Run directory not found: {run_dir}"
            )

        files = {
            path.relative_to(run_dir)
            for path in run_dir.rglob("*.csv")
        }

        common_files = common_files & files

    print(f"Found {len(common_files)} matching CSV files")

    for relative_path in sorted(common_files):
        combine_csv_files(relative_path)


if __name__ == "__main__":
    main()