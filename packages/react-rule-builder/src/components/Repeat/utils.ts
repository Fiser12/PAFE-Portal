import { Frequency } from "rrule";
import { TextFieldProps } from "@mui/material/TextField";
import { InputLabelProps } from "@mui/material";
import { Months, Weekday, WeekdayExtras } from "./Repeat.types";

export const frequencyTextMapping = {
  [Frequency.YEARLY]: "Anual",
  [Frequency.MONTHLY]: "Mensual",
  [Frequency.WEEKLY]: "Semanal",
  [Frequency.DAILY]: "Diario",
  [Frequency.HOURLY]: "Cada hora",
  [Frequency.MINUTELY]: "Cada minuto",
  [Frequency.SECONDLY]: "Cada segundo",
};

export const weekdayFullTextMapping = {
  [Weekday.MO]: "Lunes",
  [Weekday.TU]: "Martes",
  [Weekday.WE]: "Miercoles",
  [Weekday.TH]: "Jueves",
  [Weekday.FR]: "Viernes",
  [Weekday.SA]: "Sábado",
  [Weekday.SU]: "Domingo",
  [WeekdayExtras.DAY]: "Día",
  [WeekdayExtras.WEEKDAY]: "Entre semana",
  [WeekdayExtras.WEEKEND]: "Fin de semana",
};

export const weekdayShortTextMapping = {
  [Weekday.MO]: "Lun",
  [Weekday.TU]: "Mar",
  [Weekday.WE]: "Mie",
  [Weekday.TH]: "Jue",
  [Weekday.FR]: "Vie",
  [Weekday.SA]: "Sab",
  [Weekday.SU]: "Dom",
};

export const onTheTextMapping = {
  1: "Primero",
  2: "Segundo",
  3: "Tercero",
  4: "Cuarto",
  "-1": "Último",
};

export const monthFullTextMapping = {
  [Months.JAN]: "Enero",
  [Months.FEB]: "Febrero",
  [Months.MAR]: "Marzo",
  [Months.APR]: "Abril",
  [Months.MAY]: "Mayo",
  [Months.JUN]: "Junio",
  [Months.JUL]: "Julio",
  [Months.AUG]: "Agosto",
  [Months.SEP]: "Septiembre",
  [Months.OCT]: "Octubre",
  [Months.NOV]: "Noviembre",
  [Months.DEC]: "Diciembre",
};

export const monthShortTextMapping = {
  [Months.JAN]: "Ene",
  [Months.FEB]: "Feb",
  [Months.MAR]: "Mar",
  [Months.APR]: "Abr",
  [Months.MAY]: "May",
  [Months.JUN]: "Jun",
  [Months.JUL]: "Jul",
  [Months.AUG]: "Ago",
  [Months.SEP]: "Sep",
  [Months.OCT]: "Oct",
  [Months.NOV]: "Nov",
  [Months.DEC]: "Dic",
};

export const addOrRemoveFromArray = (array: number[], value: number) => {
  if (array.includes(value)) {
    return array.filter((item) => item !== value);
  }

  return [...array, value];
};

// get the label equivalent of input size
export const getLabelSize = (inputSize: TextFieldProps["size"]): InputLabelProps["size"] => (inputSize === "small" ? "small" : "normal");
