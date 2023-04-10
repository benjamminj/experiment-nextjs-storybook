import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import path from "node:path";
import fs from "node:fs/promises";
import dynamic from "next/dynamic";
import { ComponentType, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { glob } from "glob";
import capitalize from "lodash/capitalize";
import Link from "next/link";

type Story = {
  title: string;
  group: string | null;
  slug: string;
};

type ComponentRouteProps = { stories: Story[] };

export const getStaticPaths: GetStaticPaths = async () => {
  const stories = await glob("components/**/*.story.tsx");
  type Path = Awaited<ReturnType<GetStaticPaths>>["paths"][number];
  let paths: Path[] = [];

  for (const storyFilePath of stories) {
    const slug = storyFilePath
      .replace("components/", "")
      .replace(".story.tsx", "");

    paths.push({ params: { story: slug } });
  }

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ComponentRouteProps> = async () => {
  // TODO:
  //
  // 1. Get the full list of components to show in the sidebar
  // 2. Each component's "story" name should be the title of the .stories file
  //    While this is a little more verbose if you're doing lots of stories, it's
  //    also more explicit from a quick scan of the filesystem.
  //
  // 3. Validate that the current story exists

  // 1. Read all of the files in the directory and build up a list of available
  //    stories.
  const storyPaths = await glob("components/**/*.story.tsx");

  const stories: Story[] = [];

  for (const storyFilePath of storyPaths) {
    const raw = await fs.readFile(
      path.resolve(process.cwd(), storyFilePath),
      "utf-8"
    );

    const titleMatch = raw.match(
      /export (?:const) title = (?:'|")(?<title>.*)(?:'|")/
    );

    const slug = storyFilePath
      .replace("components/", "")
      .replace(".story.tsx", "");
    const title = titleMatch?.groups?.title ?? capitalize(slug);

    const groupMatch = raw.match(
      /export (?:const) group = (?:'|")(?<group>.*)(?:'|")/
    );
    const group = groupMatch?.groups?.group ?? null;

    stories.push({ title, group, slug });
    // console.log("~~", raw);
  }

  return { props: { stories } };
};

const ComponentRoute = ({ stories }: ComponentRouteProps) => {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);

  const router = useRouter();
  useEffect(() => {
    if (router.query.story) {
      import(`~/components/${router.query.story}.story.tsx`).then((ex) => {
        setComponent(() => ex.default as ComponentType);
      });
    }
  }, [router.query.story]);

  console.log("stories", stories);
  return (
    <div className="w-full min-h-screen bg-gray-800 flex">
      {/* TODO: more accessible markup */}
      <nav className="py-8 px-4 space-y-4 max-w-xs">
        <h1 className="text-gray-400">Stories</h1>
        <ul>
          {stories.map((story) => (
            <li key={story.slug}>
              <Link href={`/_/dev/${story.slug}`}>{story.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="p-8 bg-gray-700 flex-grow">
        {Component && <Component />}
      </main>
    </div>
  );
};

export default ComponentRoute;
