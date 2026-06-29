const { report } = require('../models');

const reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reportedId = parseInt(userId);

    if (isNaN(reportedId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    if (reportedId === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    const result = await report.add(req.userId, reportedId);

    if (!result) {
      return res.status(400).json({ error: 'Vous avez déjà signalé cet utilisateur' });
    }

    res.json({ message: 'L\'utilisateur a été signalé à nos équipes avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { reportUser };