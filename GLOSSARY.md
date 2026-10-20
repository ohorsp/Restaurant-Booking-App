# Big Al's Pizza

The domain of one pizza restaurant: seating requests made ahead of time, and food collected the same day.

## Language

**Restaurant**:
The single venue this app serves: Big Al's Pizza. Guests call 02 1234 1234.
_Avoid_: venue, location, store, shop

**Dinner service**:
Tuesday to Saturday, 17:30–22:30 Sydney time. The Restaurant is closed Sunday and Monday.
_Avoid_: opening hours, store hours

**Guest**:
A person who makes a Reservation or a Takeaway Order. Identified by a name and a phone number, with no account.
_Avoid_: user, customer, account

**Table**:
A physical table in the Restaurant with a fixed capacity of 2, 4, 6, or 10 seats. Big Al's has twelve — four with 2 seats, five with 4, two with 6, and one with 10 — and a Guest chooses a specific one.
_Avoid_: seat, cover

**Reservation**:
A Guest's hold on one Table for a party size, a start time, and a duration of 1 hour, 90 minutes, or 2 hours. It falls during Dinner service, must end by 22:30, may be made up to 30 days ahead, does not include food, and can be cancelled only by calling the Restaurant.
_Avoid_: booking, table booking

**Takeaway Order**:
Food a Guest orders for pickup during Dinner service. The Guest chooses no pickup time, cannot cancel, pays the total at the Restaurant, and is told the average wait is 20–60 minutes; the order never holds a Table or includes delivery.
_Avoid_: delivery, booking, reservation

**Menu**:
The fixed list of food and drink the Restaurant sells for pickup, grouped into Traditional pizzas, Italian pizzas, garlic bread, and drinks. Viewing the Menu places no order.
_Avoid_: catalog, product list

**Menu Item**:
One named thing a Guest can add to a Takeaway Order.
_Avoid_: product, SKU

**Base**:
Regular or Gluten Free, chosen once per line for every pizza and for both garlic breads. Gluten Free adds $4 to each one. Drinks have no Base.
_Avoid_: crust, size
