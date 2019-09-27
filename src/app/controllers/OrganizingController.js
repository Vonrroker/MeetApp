import Meetup from '../models/Meetup';
import File from '../models/File';

class OrganizingController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      attributes: [
        'id',
        'user_id',
        'banner_id',
        'title',
        'description',
        'locale',
        'date',
      ],
      include: [
        {
          model: File,
          as: 'file',
        },
      ],
    });

    return res.json(meetups);
  }
}

export default new OrganizingController();
