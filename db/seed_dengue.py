#!/usr/bin/env python3
"""
Seed script to import Dengue 2026 data from Excel into MySQL database.
Usage: python db/seed_dengue.py
"""
import pandas as pd
import mysql.connector
from mysql.connector import Error
import re
from datetime import datetime

# Database connection
DB_CONFIG = {
    "host": "ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com",
    "port": 4000,
    "user": "2JE4LrwNYERyeTU.root",
    "password": "zLjpAqtv9r5nGcSV4qKLZBdBmebHXaNK",
    "database": "19f3f1ca-3952-8cdc-8000-093815db34f0",
    "ssl_disabled": False,
}

EXCEL_PATH = "/mnt/agents/upload/DATA DENGUE 2026.xlsx"


def parse_semana(sem_str):
    """Parse SEM string like 'SEM 1' to extract week number."""
    match = re.search(r'SEM\s+(\d+)', str(sem_str))
    if match:
        return f"SEM {int(match.group(1))}"
    return "SEM 0"


def determine_sexo_and_edad(row):
    """Determine sex and age from M/F columns."""
    if pd.notna(row['M']) and row['M'] != '':
        return 'M', int(float(row['M']))
    elif pd.notna(row['F']) and row['F'] != '':
        return 'F', int(float(row['F']))
    return 'M', 0


def clean_value(val, default=''):
    """Clean a value for database insertion."""
    if pd.isna(val):
        return default
    val = str(val).strip()
    if val.upper() == 'NAN':
        return default
    return val


def seed_database():
    print("Reading Excel file...")
    df = pd.read_excel(EXCEL_PATH)
    print(f"Total records in Excel: {len(df)}")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Check if table already has data
        cursor.execute("SELECT COUNT(*) FROM dengue_cases")
        count = cursor.fetchone()[0]
        if count > 0:
            print(f"Table already has {count} records. Skipping seed.")
            return

        inserted = 0
        errors = 0

        for idx, row in df.iterrows():
            try:
                sexo, edad = determine_sexo_and_edad(row)
                semana = parse_semana(row['SEM'])

                # Parse fecha
                fecha = row['Fecha']
                if pd.isna(fecha):
                    # Try to construct from semana or skip
                    fecha = datetime(2026, 1, 1).date()
                elif isinstance(fecha, str):
                    try:
                        fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
                    except:
                        fecha = datetime(2026, 1, 1).date()
                elif isinstance(fecha, datetime):
                    fecha = fecha.date()

                # Clean other fields
                nombres = clean_value(row['Nombres y Apellidos'])
                hospitalizado = clean_value(row['H'], 'NO').upper()
                diagnostico = clean_value(row['Diagnóstico'], 'DENGUE SIN SIGNOS DE ALARMA')
                muestra = clean_value(row['MU'], 'NO').upper()
                direccion = clean_value(row['Dirección'])
                parroquia = clean_value(row['Parroquia'], 'DESCONOCIDO')
                municipio = clean_value(row['Municipio'], 'DESCONOCIDO')
                reportado_por = clean_value(row['Reportado por'], 'DESCONOCIDO')

                # Validate enums
                if hospitalizado not in ['SI', 'NO']:
                    hospitalizado = 'NO'
                if muestra not in ['SI', 'NO']:
                    muestra = 'NO'
                if diagnostico not in ['DENGUE SIN SIGNOS DE ALARMA', 'DENGUE CON SIGNOS DE ALARMA']:
                    diagnostico = 'DENGUE SIN SIGNOS DE ALARMA'

                # Normalize semana to proper format
                sem_num = re.search(r'SEM\s+(\d+)', semana)
                if sem_num:
                    semana = f"SEM {int(sem_num.group(1))}"

                sql = """
                INSERT INTO dengue_cases
                (semana, fecha, nombres_apellidos, edad, sexo, hospitalizado, diagnostico, muestra, direccion, parroquia, municipio, reportado_por)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    semana, fecha, nombres, edad, sexo,
                    hospitalizado, diagnostico, muestra,
                    direccion, parroquia, municipio, reportado_por
                ))
                inserted += 1

                if inserted % 100 == 0:
                    conn.commit()
                    print(f"  Inserted {inserted} records...")

            except Exception as e:
                errors += 1
                print(f"  Error on row {idx + 1}: {e}")
                continue

        conn.commit()
        print(f"\nDone! Inserted {inserted} records. Errors: {errors}")

    except Error as e:
        print(f"Database error: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("Connection closed.")


if __name__ == "__main__":
    seed_database()
