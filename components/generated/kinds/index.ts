import type { ComponentType } from "react";
import type { AppKind } from "@/lib/mock/types";
import PasanakuCircles from "./PasanakuCircles";
import BillSplit from "./BillSplit";
import MoneyPool from "./MoneyPool";
import VendorPayLink from "./VendorPayLink";
import QrMenuOrders from "./QrMenuOrders";
import RaffleHub from "./RaffleHub";
import EventTickets from "./EventTickets";
import MatchPredictions from "./MatchPredictions";
import MarketOrders from "./MarketOrders";

export const KIND_SCREENS: Record<AppKind, ComponentType> = {
  "pasanaku-circles": PasanakuCircles,
  "bill-split": BillSplit,
  "money-pool": MoneyPool,
  "vendor-pay-link": VendorPayLink,
  "qr-menu-orders": QrMenuOrders,
  "raffle-hub": RaffleHub,
  "event-tickets": EventTickets,
  "match-predictions": MatchPredictions,
  "market-orders": MarketOrders,
};
