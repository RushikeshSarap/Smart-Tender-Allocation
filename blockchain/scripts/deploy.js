import hre from "hardhat";

async function main() {
  const TenderContract = await hre.ethers.getContractFactory("TenderContract");
  const tenderContract = await TenderContract.deploy();
  await tenderContract.waitForDeployment();

  console.log("TenderContract deployed to:", await tenderContract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
