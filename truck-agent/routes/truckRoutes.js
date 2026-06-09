const express = require("express");
const router = express.Router();

const truckService = require("../services/truckService");

router.get("/", (req, res) => {
  res.json(truckService.getAllTrucks());
});

router.get("/:truckId/state", (req, res) => {
  res.json(truckService.maintainTruckState(req.params.truckId));
});

router.post("/:truckId/validate-capability", (req, res) => {
  res.json(
    truckService.validateTruckCapability(req.params.truckId, req.body)
  );
});

router.post("/eligible-trucks", (req, res) => {
  res.json(truckService.findEligibleTrucks(req.body));
});

router.post("/:truckId/predict-availability", (req, res) => {
  const { tripEndTime, unloadMinutes, restMinutes } = req.body;

  res.json(
    truckService.predictAvailability(
      req.params.truckId,
      tripEndTime,
      unloadMinutes,
      restMinutes
    )
  );
});

router.get("/:truckId/utilization", (req, res) => {
  res.json(truckService.calculateUtilization(req.params.truckId));
});

router.get("/broadcast/state", (req, res) => {
  res.json(truckService.broadcastTruckState());
});

router.post("/:truckId/estimate-arrival", (req, res) => {
  const { destination } = req.body;

  res.json(
    truckService.estimateArrival(req.params.truckId, destination)
  );
});

router.get("/:truckId/route-info", (req, res) => {
  res.json(truckService.provideRouteInfo(req.params.truckId));
});

router.get("/backhaul/completing-deliveries", (req, res) => {
  res.json(truckService.getTrucksCompletingDeliveries());
});

router.put("/:truckId/state", (req, res) => {
  res.json(
    truckService.updateTruckState(req.params.truckId, req.body)
  );
});

module.exports = router;