import { isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import Mail from '../../lib/Mail';
import User from '../models/User';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
        },
      ],
    });
    return res.json(subscriptions);
  }

  async store(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res
        .status(400)
        .json({ error: `Doesn't exists meetup with id ${id}` });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Meetup already passed' });
    }

    const meetupsSubs = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: id,
      },
    });

    if (meetupsSubs) {
      return res
        .status(400)
        .json({ error: 'You already subscribed in this meetup' });
    }

    const subSameHour = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: { date: meetup.date },
        },
      ],
    });

    if (subSameHour) {
      return res.status(400).json({
        error: 'You are already registered for a meetup at this time.',
      });
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: id,
    });

    await subscription.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Aviso de Inscrição em meetup',
      template: 'subscribe',
      context: {
        user_owner: meetup.user.name,
        user_sub: subscription.user.name,
        email_sub: subscription.user.email,
        locale_meetup: meetup.locale,
        date_meetup: format(meetup.date, "dd 'de' MMMM', às' HH:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json({ subscription });
  }
}

export default new SubscriptionController();
