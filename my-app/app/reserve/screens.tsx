import Link from "next/link";
import { Button } from "@/components/ui/button";
import type {
  CalendarView,
  ConfirmView,
  Duration,
  FloorTable,
  FloorView,
  ReserveView,
  StartsView,
  SuccessView,
} from "@/guest/serve-guest";

export function reserveHref(parts: {
  partySize: number;
  duration: Duration;
  day?: string;
  start?: string;
  table?: number;
}) {
  const params = new URLSearchParams();
  params.set("partySize", String(parts.partySize));
  params.set("duration", parts.duration);
  if (parts.day) params.set("day", parts.day);
  if (parts.start) params.set("start", parts.start);
  if (parts.table !== undefined) params.set("table", String(parts.table));
  return `/reserve?${params.toString()}`;
}

function Filters(props: {
  partySize: number;
  partySizes: number[];
  duration: Duration;
  durations: Duration[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Party size</legend>
        <div className="grid grid-cols-5 gap-2">
          {props.partySizes.map((size) => (
            <Button
              key={size}
              variant={size === props.partySize ? "default" : "outline"}
              className="h-12 text-base"
              nativeButton={false}
              render={
                <Link
                  href={reserveHref({
                    partySize: size,
                    duration: props.duration,
                  })}
                  aria-current={size === props.partySize ? "true" : undefined}
                />
              }
            >
              {size}
            </Button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Duration</legend>
        <div className="flex flex-col gap-2">
          {props.durations.map((duration) => (
            <Button
              key={duration}
              variant={duration === props.duration ? "default" : "outline"}
              className="h-12 w-full text-base"
              nativeButton={false}
              render={
                <Link
                  href={reserveHref({
                    partySize: props.partySize,
                    duration,
                  })}
                />
              }
            >
              {duration}
            </Button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function Header({ title, backHref }: { title: string; backHref: string }) {
  return (
    <header className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="h-12 w-fit px-4 text-base"
        nativeButton={false}
        render={<Link href={backHref} />}
      >
        Back
      </Button>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Big Al&apos;s Pizza</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}

function tableCount(count: number) {
  return count === 1 ? "1 table" : `${count} tables`;
}

function Calendar({ view }: { view: CalendarView }) {
  return (
    <main className="flex flex-col gap-8">
      <Header title="Make a reservation" backHref="/" />
      <Filters
        partySize={view.partySize}
        partySizes={view.partySizes}
        duration={view.duration}
        durations={view.durations}
      />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Day</h2>
        <ul className="flex flex-col gap-2">
          {view.days.map((day) =>
            day.selectable ? (
              <li key={day.date}>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-between text-base"
                  nativeButton={false}
                  render={
                    <Link
                      href={reserveHref({
                        partySize: view.partySize,
                        duration: view.duration,
                        day: day.date,
                      })}
                    />
                  }
                >
                  <span>{day.label}</span>
                  <span>{day.count === null ? "" : tableCount(day.count)}</span>
                </Button>
              </li>
            ) : (
              <li key={day.date}>
                <Button
                  disabled
                  variant="outline"
                  className="h-12 w-full justify-between text-base"
                >
                  <span>{day.label}</span>
                  {day.count === null ? null : <span>{tableCount(day.count)}</span>}
                </Button>
              </li>
            ),
          )}
        </ul>
      </section>
    </main>
  );
}

function Starts({ view }: { view: StartsView }) {
  return (
    <main className="flex flex-col gap-8">
      <Header
        title={view.dayLabel}
        backHref={reserveHref({
          partySize: view.partySize,
          duration: view.duration,
        })}
      />
      <Filters
        partySize={view.partySize}
        partySizes={view.partySizes}
        duration={view.duration}
        durations={view.durations}
      />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Start</h2>
        <ul className="flex flex-col gap-2">
          {view.starts.map((start) => (
            <li key={start}>
              <Button
                variant="outline"
                className="h-12 w-full text-base"
                nativeButton={false}
                render={
                  <Link
                    href={reserveHref({
                      partySize: view.partySize,
                      duration: view.duration,
                      day: view.day,
                      start,
                    })}
                  />
                }
              >
                {start}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function TableChoice({
  table,
  href,
}: {
  table: FloorTable;
  href: string;
}) {
  const green = table.color === "green";
  return (
    <Button
      disabled={!table.choosable}
      className={
        green
          ? "h-16 w-full flex-col bg-green-700 text-xs text-white hover:bg-green-800"
          : "h-16 w-full flex-col text-xs"
      }
      nativeButton={false}
      render={table.choosable ? <Link href={href} /> : undefined}
    >
      <span className="text-base">Table {table.number}</span>
      <span>{table.seats} seats</span>
    </Button>
  );
}

function Floor({ view }: { view: FloorView }) {
  const front = view.tables.filter((table) => table.row === "Front");
  const middle = view.tables.filter((table) => table.row === "Middle");
  const backSides = view.tables.filter((table) => table.row === "Back" && !table.center);
  const backCenter = view.tables.find((table) => table.row === "Back" && table.center);
  const hrefFor = (table: FloorTable) =>
    reserveHref({
      partySize: view.partySize,
      duration: view.duration,
      day: view.day,
      start: view.start,
      table: table.number,
    });

  return (
    <main className="flex flex-col gap-8">
      <Header
        title={view.start}
        backHref={reserveHref({
          partySize: view.partySize,
          duration: view.duration,
          day: view.day,
        })}
      />
      <Filters
        partySize={view.partySize}
        partySizes={view.partySizes}
        duration={view.duration}
        durations={view.durations}
      />
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Table</h2>
        {front.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Front</h3>
            <div className="grid grid-cols-4 gap-2">
              {front.map((table) => (
                <TableChoice key={table.number} table={table} href={hrefFor(table)} />
              ))}
            </div>
          </div>
        ) : null}
        {middle.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Middle</h3>
            <div className="grid grid-cols-5 gap-2">
              {middle.map((table) => (
                <TableChoice key={table.number} table={table} href={hrefFor(table)} />
              ))}
            </div>
          </div>
        ) : null}
        {backSides.length > 0 || backCenter ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Back</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                {backSides[0] ? (
                  <TableChoice table={backSides[0]} href={hrefFor(backSides[0])} />
                ) : null}
              </div>
              <div>
                {backCenter ? (
                  <TableChoice table={backCenter} href={hrefFor(backCenter)} />
                ) : null}
              </div>
              <div>
                {backSides[1] ? (
                  <TableChoice table={backSides[1]} href={hrefFor(backSides[1])} />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function ConfirmDetails({
  view,
  children,
}: {
  view: ConfirmView;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex flex-col gap-8">
      <Header
        title="Confirm"
        backHref={reserveHref({
          partySize: view.partySize,
          duration: view.duration,
          day: view.day,
          start: view.start,
        })}
      />
      <Filters
        partySize={view.partySize}
        partySizes={view.partySizes}
        duration={view.duration}
        durations={view.durations}
      />
      <dl className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Table</dt>
          <dd className="font-medium">{view.tableName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Party size</dt>
          <dd className="font-medium">{view.partySize}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{view.duration}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Start</dt>
          <dd className="font-medium">{view.start}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium">{view.date}</dd>
        </div>
      </dl>
      {children}
    </main>
  );
}

function Success({ view }: { view: SuccessView }) {
  return (
    <main className="flex flex-col gap-8">
      <Header title="Reservation" backHref="/" />
      <dl className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Table</dt>
          <dd className="font-medium">{view.tableName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Party size</dt>
          <dd className="font-medium">{view.partySize}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{view.duration}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Start</dt>
          <dd className="font-medium">{view.start}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium">{view.date}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{view.name}</dd>
        </div>
      </dl>
      <p>{view.cancel}</p>
    </main>
  );
}

export function ReservationScreens({ view }: { view: ReserveView }) {
  if (view.screen === "calendar") return <Calendar view={view} />;
  if (view.screen === "starts") return <Starts view={view} />;
  if (view.screen === "floor") return <Floor view={view} />;
  if (view.screen === "confirm") return <ConfirmDetails view={view} />;
  if (view.screen === "success") return <Success view={view} />;
  return (
    <main className="flex flex-col gap-8">
      <Header title="Make a reservation" backHref="/" />
    </main>
  );
}