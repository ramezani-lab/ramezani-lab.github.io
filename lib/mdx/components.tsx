import { Children, isValidElement, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { Callout } from "@/components/content/callout";
import { Figure } from "@/components/content/figure";

/** Internal links route through next/link; external ones open safely. */
function MdxLink({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link href={href} {...props} />;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

/**
 * Components available to every MDX file. Content carries no imports, so this
 * is the whole vocabulary an author can use.
 */
export function mdxComponents(baseUrl?: string) {
  function MdxImg(props: ComponentPropsWithoutRef<"img">) {
    return (
      <Figure
        src={typeof props.src === "string" ? props.src : undefined}
        alt={props.alt}
        title={props.title}
        baseUrl={baseUrl}
      />
    );
  }

  function BoundFigure(
    props: Omit<ComponentPropsWithoutRef<typeof Figure>, "baseUrl">,
  ) {
    return <Figure {...props} baseUrl={baseUrl} />;
  }

  /** Markdown wraps a lone image in <p>; a <figure> inside <p> is invalid. */
  function MdxParagraph({ children, ...props }: ComponentPropsWithoutRef<"p">) {
    const block = Children.toArray(children).some(
      (child) =>
        isValidElement(child) &&
        (child.type === MdxImg ||
          child.type === BoundFigure ||
          child.type === Callout),
    );
    return block ? (
      <div {...props}>{children}</div>
    ) : (
      <p {...props}>{children}</p>
    );
  }

  function MdxTable(props: ComponentPropsWithoutRef<"table">) {
    return (
      <div className="overflow-x-auto">
        <table {...props} />
      </div>
    );
  }

  return {
    a: MdxLink,
    p: MdxParagraph,
    img: MdxImg,
    table: MdxTable,
    Callout,
    Figure: BoundFigure,
  };
}
