const database = require('../models');
const sequelize = require("sequelize");
const { Op } = require("sequelize");

class EventsController {
  static async getAllEvents(req, res) {
    try {
      const events = await database.Events.findAll({
        where: {
          date: {
            [Op.or]: {
              [Op.gte]: new Date(),
              [Op.eq]: null
            }
          }
        },
        order: [['date']],
        include: [database.Locals, database.Branchs]
      });
      return res.status(200).json(events);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async getEvent(req, res) {
    const { id } = req.params;
    try {
      const event = await database.Events.findOne({
        where: { id: Number(id) },
        include: [database.Locals, database.Branchs]
      });
      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async searchEvent(req, res) {
    const { search } = req.params;
    console.log(req.params);
    try {
      const event = await database.Events.findAll({
        where: {
          name: sequelize.where(sequelize.fn('LOWER', sequelize.col('Events.name')), 'LIKE', '%' + search + '%')
        },
        order: [['date']],
        include: [database.Locals, database.Branchs]
      });
      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async createEvent(req, res) {
    console.log(req.file);
    return res.send(req.file);
    const body = req.body;
    try {
      const newEvent = await database.Events.create(body);
      return res.status(200).json(newEvent);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async recuseParticipant(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
      var eventConfirm = await database.EventsConfirmations.findOne({ where: {event_id: Number(id), member_id: Number(memberId)}});
      if (eventConfirm)
      {
        if (eventConfirm.confirmed == false)
        {
          return res.status(409).json("O membro j?? recusado.");
        }
        if (eventConfirm.checkin == true)
        {
          return res.status(409).json("N??o p??de ser recusado, o check-in j?? foi feito. Fa??a o check-out antes.");
        }
        await database.EventsConfirmations.update({confirmed: false}, { where: {event_id: Number(id), member_id: Number(memberId)}});
        return res.status(200).json("O membro estava confirmado nesse evento");
      }
      eventConfirm = await database.EventsConfirmations.create({event_id: Number(id), member_id: Number(memberId), confirmed: false});
      return res.status(200).json("Membro recusado");
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async confirmParticipant(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
      var eventConfirm = await database.EventsConfirmations.findOne({ where: {event_id: Number(id), member_id: Number(memberId)}});
      if (eventConfirm)
      {
        eventConfirm = await database.EventsConfirmations.update({confirmed: true}, {where: {event_id: Number(id), member_id: Number(memberId)}})
        return res.status(200).json(eventConfirm);
      }
      eventConfirm = await database.EventsConfirmations.create({event_id: Number(id), member_id: Number(memberId), confirmed: true});
      return res.status(200).json(eventConfirm);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async paidParticipant(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
      var eventConfirm = await database.EventsConfirmations.findOne({ where: {event_id: Number(id), member_id: Number(memberId)}});
      if (!eventConfirm)
      {
        return res.status(409).json("O membro n??o est?? confirmado nesse evento");
      }
      if (eventConfirm.checkin == true)
      {
        return res.status(409).json("O membro j?? est?? com o checkin feito");
      }
      await database.EventsConfirmations.update({paid: true}, { where: {event_id: Number(id), member_id: Number(memberId)}});
      return res.status(200).json("Pagamento feito");
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async checkinParticipant(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
      var eventConfirm = await database.EventsConfirmations.findOne({ where: {event_id: Number(id), member_id: Number(memberId)}});
      if (!eventConfirm)
      {
        return res.status(409).json("O membro n??o est?? confirmado nesse evento");
      }
      if (eventConfirm.checkin == true)
      {
        return res.status(409).json("O membro j?? est?? com o checkin feito");
      }
      await database.EventsConfirmations.update({checkin: true}, { where: {event_id: Number(id), member_id: Number(memberId)}});
      return res.status(200).json("Check-in feito");
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async checkoutParticipant(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;
    try {
      var eventConfirm = await database.EventsConfirmations.findOne({ where: {event_id: Number(id), member_id: Number(memberId)}});
      if (!eventConfirm)
      {
        return res.status(409).json("O membro n??o est?? confirmado nesse evento");
      }
      if (eventConfirm.checkin == false)
      {
        return res.status(409).json("O membro n??o est?? com o checkin feito");
      }
      await database.EventsConfirmations.update({checkin: false}, { where: {event_id: Number(id), member_id: Number(memberId)}});
      return res.status(200).json("Check-out feito");
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async getParticipants(req, res) {
    const { id } = req.params;
    try {
      const events = await database.EventsConfirmations.findAll({ 
        where: {
          event_id: Number(id),
          confirmed: true
        },
        include: { all: true }
      });
      return res.status(200).json(events);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error.message);
    }
  }

  static async updateEvent(req, res) {
    const { id } = req.params;
    const newInfos = req.body;
    try {
      await database.Events.update(newInfos, { where: { id: Number(id) } });
      const eventUpdated = await database.Events.findOne({
        where: { id: Number(id) },
      });
      return res.status(200).json(eventUpdated);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  static async deleteEvent(req, res) {
    const { id } = req.params;
    try {
      await database.Events.destroy({ where: { id: Number(id) } });
      return res.status(200).json({ mensagem: `evento id ${id} deletado` });
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async cancelEvent(req, res) {
    const { id } = req.params;
    try {
      await database.Events.update({canceled: true}, { where: { id: Number(id) } });
      return res.status(200).json({ mensagem: `evento id ${id} cancelado` });
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  static async uncancelEvent(req, res) {
    const { id } = req.params;
    try {
      await database.Events.update({canceled: false}, { where: { id: Number(id) } });
      return res.status(200).json({ mensagem: `evento id ${id} descancelado` });
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
}

module.exports = EventsController;
