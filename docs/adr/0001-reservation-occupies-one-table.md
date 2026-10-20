# A Reservation occupies one Table for a continuous interval

A Guest at Big Al's Pizza chooses a Table on a floor map. The map is the current way they choose, and a later version may choose a Table another way. The stable rule is occupancy: a Reservation holds one Table from its start time until that time plus its duration (1 hour, 90 minutes, or 2 hours). The Table is available when that interval overlaps no other Reservation on the same Table. The next Reservation may start at the moment the earlier one ends.

## Considered options

- **Covers only.** The Guest books a party size and a time, and no Table is held. Rejected because each Table has a fixed capacity and the Guest is shown which Tables are free.
- **The floor map is the decision.** Rejected because the map is a presentation of the occupancy rule, not the rule itself.
