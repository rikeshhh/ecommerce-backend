const express = require("express");
const router = express.Router();
const GiveawayEntry = require("../models/GiveawayEntry");
const authMiddleware = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const sendEmail = require("../mailer");
const { format, addDays } = require("date-fns");

router.post("/enter", async (req, res) => {
  const { email } = req.body;

  try {
    const existingEntry = await GiveawayEntry.findOne({ email });
    if (existingEntry) {
      return res.status(400).json({ message: "You’ve already entered!" });
    }

    const entry = new GiveawayEntry({ email });
    await entry.save();
    res.status(201).json({ success: true, message: "Entry recorded" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error entering giveaway", error: error.message });
  }
});

router.post("/pick-winners", authMiddleware, isAdmin, async (req, res) => {
  const { numWinners } = req.body;

  try {
    const entries = await GiveawayEntry.find();
    if (entries.length === 0) {
      return res.status(400).json({ message: "No entries yet" });
    }

    const shuffled = entries.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, Math.min(numWinners, entries.length));

    const promoCodes = await Promise.all(
      winners.map(async (winner) => {
        const code = `WIN${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;
        const promoData = {
          code,
          discount: 20,
          startDate: new Date(),
          endDate: addDays(new Date(), 30),
        };

        const response = await axios.post(
          `${process.env.CLIENT_URL}/ api / promo / create`,
          promoData,
          { headers: { Authorization: req.headers.authorization } }
        );

        const promo = response.data.promo;

        await sendEmail({
          to: winner.email,
          subject: "You Won a Promo Code!",
          text: `Congrats! Your promo code is ${
            promo.code
          } - use it for 20% off! Valid until ${format(promo.endDate, "PPP")}.`,
          html: `
            <h1>Congratulations!</h1>
            <p>You’ve won a <strong>20% off promo code</strong> in our giveaway!</p>
            <p>Your code: <strong>${promo.code}</strong></p>
            <p>Valid until: ${format(promo.endDate, "PPP")}</p>
            <p>Use it at checkout on our site. Happy shopping!</p>
          `,
        });

        return { email: winner.email, code: promo.code };
      })
    );

    res.json({ success: true, winners: promoCodes });
  } catch (error) {
    console.error("Error picking winners:", error);
    res
      .status(500)
      .json({ message: "Error picking winners", error: error.message });
  }
});

module.exports = router;
