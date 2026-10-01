import csv
from pathlib import Path
import os


major = 'demangled'
run = 'run2'

base_path = Path(major) / run
# Concatinate csvs with the same op and different types


def combineRemove(minor: str, src: str, dest: str):

    path = base_path/minor
    print(f"Adding contents of {path/src} to {path/dest}")
    try:
        src_f = open(path/src, "r")
        reader = csv.DictReader(src_f)
    except:
        print(f"Missing src file {src}, assuming already moved")
        return

    with open(path/dest, "a", newline='') as wf:
        headers = reader.fieldnames if not reader.fieldnames is None else []
        writer = csv.DictWriter(wf, headers)
        for row in reader:
            writer.writerow(row)
    src_f.close()

    os.remove(path/src)



combineRemove('Core', 'bench_gemm_double.csv', 'bench_gemm.csv')
combineRemove('EigenValues', 'bench_geev_float.csv', 'bench_geev.csv')