import { notFound } from "next/navigation";
import { getEligiblePeserta, getWinnerCount } from "./actions/draw";
import DrawClient from "./DrawClient";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DrawPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  const secretToken = process.env.DRAW_SECRET_TOKEN;

  if (!secretToken || token !== secretToken) {
    notFound();
  }

  const [eligible, winnerCount] = await Promise.all([
    getEligiblePeserta(),
    getWinnerCount(),
  ]);

  return <DrawClient initialEligible={eligible} initialWinnerCount={winnerCount} />;
}
