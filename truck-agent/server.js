const express = require("express");
const cors = require("cors");

const truckRoutes = require("./routes/truckRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Truck Agent / Fleet Orchestrator is running"
  });
});

app.use("/api/trucks", truckRoutes);

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Truck Agent running on http://localhost:${PORT}`);
});