import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';
import Subscription from '../models/Subscription';

class MeetupController {
  async index(req, res) {
    const schema = Yup.object().shape({
      page: Yup.number(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Validation invalid' });
    }
    const { date, page = 1 } = req.query;

    const subscribedMeetups = await Subscription.findAll({
      where: { user_id: req.userId },
      attributes: ['meetup_id'],
      raw: true,
    });

    const where = {
      id: {
        [Op.notIn]: subscribedMeetups.map(meetup => meetup.meetup_id),
      },
    };

    if (date) {
      const searchDate = parseISO(date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'file',
          attributes: ['id', 'name', 'url', 'path'],
        },
      ],
      attributes: [
        'id',
        'user_id',
        'banner_id',
        'title',
        'description',
        'locale',
        'date',
      ],
      order: ['date'],
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

    await meetup.reload({
      include: [
        {
          model: File,
          as: 'file',
        },
      ],
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

    await meetup.reload({
      include: [
        {
          model: File,
          as: 'file',
        },
      ],
    });

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
