import hre from "hardhat";

async function main() {
  const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
  
  const tenderSystem = await TenderSystem.deploy();
  await tenderSystem.waitForDeployment();

  console.log("TenderSystem deployed to:", await tenderSystem.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
