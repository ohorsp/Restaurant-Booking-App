"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { serveGuest, type TakeawayAction, type TakeawayView } from "@/guest/serve-guest";

export function TakeawayOrder({ initial }: { initial: TakeawayView }) {
  const [view, setView] = useState(initial);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const promptRef = useRef<HTMLElement>(null);
  const question = view.confirmation?.question;

  useEffect(() => {
    if (question) promptRef.current?.scrollIntoView({ block: "nearest" });
  }, [question]);

  function ask(action: TakeawayAction) {
    setView(serveGuest({ now: new Date(), action }));
  }

  if (view.closed) {
    return <p>{view.closed}</p>;
  }

  const order = view.takeawayOrder;
  if (order) {
    return (
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col">
          {order.lines.map((line) => (
            <li
              key={line.base ? `${line.name}:${line.base}` : line.name}
              className="flex items-baseline justify-between gap-4 border-b border-border py-3"
            >
              <span className="flex flex-col">
                <span>{line.name}</span>
                {line.base ? (
                  <span className="text-sm text-muted-foreground">{line.base}</span>
                ) : null}
              </span>
              <span className="font-medium">{line.quantity}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-baseline justify-between gap-4 text-base font-medium">
          <span>Total</span>
          <span>{order.total}</span>
        </p>
        <p>{order.message}</p>
      </div>
    );
  }

  const confirmation = view.confirmation;

  return (
    <div className="flex flex-col gap-8">
      {confirmation ? (
        <section ref={promptRef} className="flex flex-col gap-3">
          <p>{confirmation.question}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-12 text-base"
              onClick={() =>
                ask({
                  type: "confirm-quantity",
                  name: confirmation.name,
                  quantity: confirmation.quantity,
                  base: confirmation.base,
                  lines: view.lines,
                  answer: "yes",
                })
              }
            >
              Yes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-base"
              onClick={() =>
                ask({
                  type: "confirm-quantity",
                  name: confirmation.name,
                  quantity: confirmation.quantity,
                  base: confirmation.base,
                  lines: view.lines,
                  answer: "no",
                })
              }
            >
              No
            </Button>
          </div>
        </section>
      ) : null}

      {view.groups.map((group) => (
        <section key={group.name} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <ul className="flex flex-col">
            {group.items.map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-3 border-b border-border py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span>{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.price}</span>
                  </div>
                  {item.bases ? null : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-4 text-base"
                      onClick={() =>
                        ask({
                          type: "add-menu-item",
                          name: item.name,
                          lines: view.lines,
                        })
                      }
                    >
                      Add
                    </Button>
                  )}
                </div>
                {item.bases ? (
                  <div className="grid grid-cols-2 gap-2">
                    {item.bases.map((base) => (
                      <Button
                        key={base}
                        type="button"
                        variant="outline"
                        className="h-12 px-4 text-base"
                        onClick={() =>
                          ask({
                            type: "add-menu-item",
                            name: item.name,
                            base,
                            lines: view.lines,
                          })
                        }
                      >
                        {base}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {view.lines.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Order</h2>
          <ul className="flex flex-col">
            {view.lines.map((line) => (
              <li
                key={line.base ? `${line.name}:${line.base}` : line.name}
                className="flex flex-col gap-3 border-b border-border py-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex flex-col">
                    <span>{line.name}</span>
                    {line.base ? (
                      <span className="text-sm text-muted-foreground">{line.base}</span>
                    ) : null}
                  </span>
                  <span className="font-medium">{line.quantity}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-base"
                    disabled={line.quantity <= 1}
                    onClick={() =>
                      ask({
                        type: "set-quantity",
                        name: line.name,
                        base: line.base,
                        quantity: line.quantity - 1,
                        lines: view.lines,
                      })
                    }
                  >
                    Less
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-base"
                    disabled={line.quantity >= 10}
                    onClick={() =>
                      ask({
                        type: "set-quantity",
                        name: line.name,
                        base: line.base,
                        quantity: line.quantity + 1,
                        lines: view.lines,
                      })
                    }
                  >
                    More
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-base"
                    onClick={() =>
                      ask({
                        type: "remove-line",
                        name: line.name,
                        base: line.base,
                        lines: view.lines,
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex items-baseline justify-between gap-4 text-base font-medium">
            <span>Total</span>
            <span>{view.total}</span>
          </p>
        </section>
      ) : null}

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          ask({
            type: "place-takeaway",
            lines: view.lines,
            name,
            phone,
          });
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="guest-name">
          Name
          <Input
            id="guest-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onValueChange={setName}
            className="h-12 text-base"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="guest-phone">
          Phone number
          <Input
            id="guest-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            value={phone}
            onValueChange={setPhone}
            className="h-12 text-base"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base"
          disabled={view.lines.length === 0}
        >
          Send order
        </Button>
      </form>
    </div>
  );
}