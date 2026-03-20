import { NextResponse } from "next/server";
import { createWalletClient, http, keccak256, encodePacked, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hashkeyTestnet } from "@/app/lib/config";

export async function POST(req: Request) {
  const { userAddress } = await req.json();
  if (!userAddress) return NextResponse.json({ error: "No address" }, { status: 400 });

  try {
    const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY}`);

    // Generate nonce
    const nonce = keccak256(encodePacked(
      ["address", "uint256"],
      [userAddress as `0x${string}`, BigInt(Date.now())]
    ));

    // Sign: keccak256(userAddress + nonce + tier)
    const tier = 2;
    const message = keccak256(encodePacked(
      ["address", "bytes32", "uint8"],
      [userAddress as `0x${string}`, nonce as `0x${string}`, tier]
    ));

    const walletClient = createWalletClient({
      account,
      chain: hashkeyTestnet,
      transport: http("https://testnet.hsk.xyz"),
    });

    const signature = await walletClient.signMessage({
      message: { raw: toBytes(message) },
    });

    return NextResponse.json({ nonce, tier, signature, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message?.slice(0, 100) }, { status: 500 });
  }
}
