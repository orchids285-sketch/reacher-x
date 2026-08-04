/* eslint-disable @next/next/no-page-custom-font -- React Email renders outside Next.js page/document boundaries. */
import { Tailwind } from "@react-email/tailwind";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Text,
  Button,
  Section,
} from "@react-email/components";

const tailwindConfig = {
  theme: {
    extend: {
      letterSpacing: {
        custom: "-0.04em",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        mono: ["DM Mono", "Courier New", "monospace"],
      },
    },
  },
};

export const WaitlistConfirmationEmail = () => {
  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-white font-sans text-neutral-900">
          <Container className="block p-6">
            <Link
              href="https://foundreach.com"
              className="tracking-custom font-mono font-medium text-black"
            >
              Discovery
            </Link>
          </Container>

          <Container className="block p-6">
            <Heading className="tracking-custom text-[1.5rem] leading-[120%] font-medium text-black">
              You&apos;re on the wait-list!
            </Heading>
            <Text className="mt-4 text-[1rem] leading-[150%]">
              You&apos;re officially on the Discovery wait-list!
            </Text>
            <Text className="mt-2 text-[1rem] leading-[150%]">
              I’m Salman, and I’m building Discovery.
            </Text>
            <Text className="mt-2 text-[1rem] leading-[150%]">
              Here are a few things you can do in the meantime:
            </Text>
            <ul className="mt-2 list-none p-0 text-[1rem] leading-[150%]">
              <li>
                <strong>Join the Discord:</strong> I’m sharing early previews
                and getting feedback from people like you. ⇾{" "}
              </li>
              <li className="mt-4">
                <strong>Read my threads:</strong> I’ve been writing about
                Discovery and why I think it’s important. ⇾{" "}
                <Link
                  href="/threads"
                  className="tracking-custom font-mono text-[1rem] leading-[150%] text-neutral-500 underline underline-offset-4"
                >
                  foundreach.com
                </Link>
              </li>
            </ul>
            <Text className="mt-4 text-[1rem] leading-[150%]">
              Thanks for joining the wait-list!
            </Text>
            <Text className="mt-2 text-[1rem] leading-[150%]">—Salman</Text>
          </Container>

          <Container className="block border-t border-solid border-[#f5f5f5] p-6">
            <Link
              href="https://foundreach.com"
              className="tracking-custom mb-1 block font-mono font-medium text-black"
            >
              Discovery
            </Link>
            <Text className="m-0">
              <Link
                href="mailto:support@foundreach.com"
                className="tracking-custom font-mono font-medium text-neutral-500"
              >
                support@foundreach.com
              </Link>
            </Text>
            <Section className="mt-6">
            </Section>
            <Section>
              <Link
                href="#"
                className="mt-6 mr-6 inline-block font-medium text-neutral-900 underline underline-offset-4"
              >
                Unsubscribe
              </Link>
              <Link
                href="#"
                className="mt-6 mr-6 inline-block font-medium text-neutral-900 underline underline-offset-4"
              >
                Privacy policy
              </Link>
              <Link
                href="#"
                className="mt-6 mr-6 inline-block font-medium text-neutral-900 underline underline-offset-4"
              >
                Terms of service
              </Link>
            </Section>
            <Text className="m-0 text-sm font-medium text-neutral-500">
              Copyright © 2025&nbsp;&nbsp;
              <Link
                href="https://foundreach.com"
                className="tracking-custom mt-6 inline-block font-mono text-neutral-900"
              >
                Discovery
              </Link>
              &nbsp;.&nbsp;&nbsp;All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
