import * as Yup from 'yup';
import { isBefore, parseISO } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      banner_id: Yup.number().required(),
      description: Yup.string().required(),
      locale: Yup.string().required(),
      title: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation invalid' });
    }

    const { banner_id, description, locale, title, date } = req.body;

    const checkDatePast = isBefore(parseISO(date), new Date());

    if (checkDatePast) {
      return res.status(400).json({ error: 'Date is in the past' });
    }

    const meetup = await Meetup.create({
      user_id: req.userId,
      banner_id,
      description,
      locale,
      title,
      date,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      banner_id: Yup.number(),
      description: Yup.string(),
      locale: Yup.string(),
      title: Yup.string(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation invalid' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({
        error: `Does not exist meetup with id ${req.params.id}`,
      });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Permission denied' });
    }

    if (req.body.date && isBefore(req.body.date, new Date())) {
      return res.status(400).json({ error: 'Date invalid.' });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Meetup alredy passed' });
    }

    await meetup.update(req.body);

    meetup.save();

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup && meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Permission denied.' });
    }

    await meetup.destroy();

    return res.json('ok');
  }
}

export default new MeetupController();
