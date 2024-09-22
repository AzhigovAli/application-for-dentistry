import { body } from 'express-validator';

export const addVisitValidation = [
  body('fullName', 'Выберите пациента').isString(),
  body('date', 'Укажите дату посещения').isNumeric(),
  body('diagnosis', 'Укажите диагноз').isString(),
  body('arrivalTime', 'Укажите время приема').isString(),
  body('price', 'Укажите цену').isNumeric(),
  body('numberTooth', 'Укажите номер зуба').isNumeric(),
];

export const addPatientValidation = [
  body('fullName', 'Укажите имя').isString(),
  body('phoneNumber', 'Укажите номер телефона').isNumeric(),
];
