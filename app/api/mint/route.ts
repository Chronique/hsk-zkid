import { NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hashkeyTestnet, CONTRACTS, ZKID_ABI } from "@/app/lib/config";

export async function POST(req: Request) {
  const { userAddress } = await req.json();
  if (!userAddress) return NextResponse.json({ error: "No address" }, { status: 400 });

  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY}`);

  const walletClient = createWalletClient({
    account,
    chain: hashkeyTestnet,
    transport: http("https://testnet.hsk.xyz"),
  });

  const publicClient = createPublicClient({
    chain: hashkeyTestnet,
    transport: http("https://testnet.hsk.xyz"),
  });

  try {
    // Check already has ZKID
    const hasZKID = await publicClient.readContract({
      address: CONTRACTS.ZKID,
      abi: ZKID_ABI,
      functionName: "hasZKID",
      args: [userAddress],
    });

    if (hasZKID) return NextResponse.json({ error: "Already has ZKID" }, { status: 400 });

    // Mint via deployer (verifier)
    const hash = await walletClient.writeContract({
      address: CONTRACTS.ZKID,
      abi: ZKID_ABI,
      functionName: "mint",
      args: [userAddress, 2], // tier 2 = verified
    });

    await publicClient.waitForTransactionReceipt({ hash });
    return NextResponse.json({ success: true, txHash: hash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message?.slice(0, 100) }, { status: 500 });
  }
}
