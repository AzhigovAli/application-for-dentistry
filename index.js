import express from 'express';
import mongoose from 'mongoose';
import Visit from './models/Visit.js';
import Patient from './models/Patient.js';
import cors from 'cors';
import { addPatientValidation, addVisitValidation } from './validation.js';
import { handleValidation } from './utils/handleValidation.js';

mongoose
  .connect(
    'mongodb+srv://azigovali48:wwwwww123@cluster0.hgsi2e5.mongodb.net/?retryWrites=true&w=majority',
  )
  .then(() => {
    console.log('DB Ok');
  })
  .catch((err) => {
    console.log('DB Error', err);
  });

const app = express();
app.use(cors());
app.use(express.json());
app.get('/visits/:date/:month', async (req, res) => {
  const { date, month } = req.params;
  try {
    const visits = await Visit.find({ date: date, month: month }).sort({ arrivalTime: 1 });

    const currentTimeNumber = new Date().getHours();
    const closestVisit = visits.reduce(
      (closest, visit, index) => {
        const visitTimeNumber = Number(visit.arrivalTime.slice(0, 2));
        const difference = Math.abs(currentTimeNumber - visitTimeNumber);

        return difference < closest.difference
          ? { index, arrivalTime: visit.arrivalTime, difference }
          : closest;
      },
      { difference: Infinity, index: -1 },
    );

    if (closestVisit.index !== -1) {
      const nextVisit = visits[closestVisit.index];
      nextVisit.status = 'upcoming';
    }

    if (visits.length === 0) {
      return res.status(300).json({ message: 'На сегодня пациентов нет, отдыхай:)' });
    }
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(403).json({ message: 'Произошла ошибка' });
  }
});

app.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    console.error('Не удалось получить данные пациентов!', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await Patient.find({ _id: id });
    if (!patient) {
      return res.status(404).json({ message: 'Пациент не найден' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Произошла ошибка при получении пациента' });
  }
});

app.get('/historyVisits/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const visits = await Visit.find({ patientId: id }).sort({ date: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Произошла ошибка при получении истории посещений' });
  }
});

app.get('/patientVisit/:date/:id', async (req, res) => {
  const { date, id } = req.params;
  try {
    const visits = await Visit.find({ date: date, patientId: id });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Произошла ошибка при получении посещения' });
  }
});

app.post('/addVisit', addVisitValidation, handleValidation, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      fullName: req.body.fullName,
    });
    if (!patient) {
      return res.status(400).json({
        message: 'Пожалуйста, создайте или выберите пациента перед добавлением посещения.',
      });
    }

    const doc = new Visit({
      patientId: patient._id,
      fullName: patient.fullName,
      date: req.body.date,
      month: req.body.month,
      prepayment: req.body.prepayment,
      diagnosis: req.body.diagnosis,
      arrivalTime: req.body.arrivalTime,
      price: req.body.price,
      numberTooth: req.body.numberTooth,
      status: 'expectation',
    });

    const visit = await doc.save();

    res.json(visit);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось добавить посещение',
    });
  }
});

app.post('/addPatient', addPatientValidation, handleValidation, async (req, res) => {
  try {
    const newPatient = new Patient({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
    });

    const savedPatient = await newPatient.save();

    res.json(savedPatient);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось добавить пациента',
    });
  }
});

app.delete('/deletePatient/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await Patient.findByIdAndDelete(id);
    await Visit.deleteMany({ patientId: id });
    res.json(patient);
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при удалении пациента',
    });
  }
});

app.delete('/deleteVisit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await Visit.findByIdAndDelete(id);
    res.json(visit);
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при удалении посещения',
    });
  }
});

app.patch('/changePatient/:id', addPatientValidation, handleValidation, async (req, res) => {
  const { id } = req.params;
  try {
    const patientChange = await Patient.find(
      { _id: id },
      {
        fullName: req.body.fullName,
        phoneNumber: req.body.phoneNumber,
      },
    );
    if (!patientChange) {
      return res.status(400).json({
        message: 'Пациент не найден',
      });
    } else {
      await Patient.findByIdAndUpdate(
        { _id: id },
        {
          fullName: req.body.fullName,
          phoneNumber: req.body.phoneNumber,
        },
      );
      await Visit.updateMany({ patientId: id }, { fullName: req.body.fullName });
      res.json({ message: 'Пациент и посещения обновлены' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при обновлении пациента и посещений',
    });
  }
});

app.patch('/changeVisit/:id', addVisitValidation, handleValidation, async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await Patient.findOne({
      fullName: req.body.fullName,
    });
    if (!patient) {
      return res.status(400).json({
        message: 'Пожалуйста, создайте или выберите пациента перед добавлением посещения.',
      });
    }

    await Visit.findByIdAndUpdate(
      { _id: id },
      {
        fullName: req.body.fullName,
        phoneNumber: req.body.phoneNumber,
        date: req.body.date,
        diagnosis: req.body.diagnosis,
        arrivalTime: req.body.arrivalTime,
        price: req.body.price,
        numberTooth: req.body.numberTooth,
        prepayment: req.body.prepayment,
      },
    );
    res.json({ message: 'Посещение обновлено' });
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при получении пациента',
    });
  }
});
app.post('/acceptVisit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Visit.findByIdAndUpdate(
      { _id: id },
      {
        status: 'accepted',
      },
    );
    res.json({ message: 'Посещение принято' });
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при получении пациента',
    });
  }
});
app.post('/cancelledVisit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Visit.findByIdAndUpdate(
      { _id: id },
      {
        status: 'cancelled',
      },
    );
    res.json({ message: 'Посещение отменено' });
  } catch (error) {
    res.status(500).json({
      message: 'Произошла ошибка при получении пациента',
    });
  }
});
app.listen(5000, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log('SERVER OK');
});
