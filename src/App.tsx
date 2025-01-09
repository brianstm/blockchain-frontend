import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
interface Block {
  index: number;
  previous_hash: string;
  transactions: unknown[];
  proof: number;
}

interface Contract {
  address: string;
  owner: string;
  state: unknown;
}

interface MineData {
  index: number;
  message: string;
  previous_hash: string;
  proof: number;
  transactions: unknown[];
}

const BlockchainDashboard = () => {
  const [chain, setChain] = useState<Block[]>([]);
  const [transaction, setTransaction] = useState({
    sender: "",
    recipient: "",
    amount: "",
  });
  const [transactionResponse, setTransactionResponse] = useState("");
  const [fraudScore, setFraudScore] = useState<{
    anomaly: boolean;
    error: number;
  } | null>(null);
  const [contractParams, setContractParams] = useState({
    owner: "",
    type: "token",
    params: { initial_supply: "" },
  });
  const [contractAddress, setContractAddress] = useState("");
  const [contractMethod, setContractMethod] = useState("");
  const [methodParams, setMethodParams] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mineData, setMineData] = useState<MineData | null>(null);

  // Fetch blockchain data
  const fetchChain = async () => {
    try {
      const response = await fetch("http://localhost:5000/chain");
      const data = await response.json();
      setChain(data.chain);
    } catch {
      console.error(error);
      setError("Failed to fetch blockchain data");
    }
  };

  // Create new transaction
  const handleTransaction = async () => {
    if (
      transaction.sender === "" ||
      transaction.recipient === "" ||
      transaction.amount === ""
    ) {
      return;
    }
    setLoading(true);
    try {
      // First check for fraud
      const fraudCheck = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_value: parseFloat(transaction.amount),
          frequency: 1,
          latitude: 1.3521, // Singapore coordinates as example
          longitude: 103.8198,
          location_deviation: 0,
        }),
      });
      const fraudData = await fraudCheck.json();
      setFraudScore(fraudData);

      if (!fraudData.anomaly) {
        const response = await fetch("http://localhost:5000/transactions/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        });
        const data = await response.json();
        setTransactionResponse(data.message);
        fetchChain();
        setTransaction({ sender: "", recipient: "", amount: "" });
      }
    } catch {
      setError("Transaction failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChain();
  }, []);

  const handleMine = async () => {
    try {
      const res = await fetch("http://localhost:5000/mine");
      const data = await res.json();
      setMineData(data);
      fetchChain();
    } catch {
      setError("Mining failed");
    }
  };

  const handleDeployContract = async () => {
    try {
      const response = await fetch("http://localhost:5000/contracts/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractParams),
      });
      const data = await response.json();
      setContractAddress(data.address);
    } catch {
      setError("Contract deployment failed");
    }
  };

  const handleExecuteContract = async () => {
    try {
      await fetch(
        `http://localhost:5000/contracts/${contractAddress}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: contractMethod,
            params: JSON.parse(methodParams),
          }),
        }
      );
      fetchContractState();
    } catch {
      setError("Contract execution failed");
    }
  };

  const fetchContractState = async () => {
    if (!contractAddress) return;
    try {
      const response = await fetch(
        `http://localhost:5000/contracts/${contractAddress}/state`
      );
      const data = await response.json();
      setContracts([...contracts, data]);
    } catch {
      setError("Failed to fetch contract state");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Blockchain Dashboard</CardTitle>
          <CardDescription>
            By: Alexander, Aurelia, Brians, Julian, Vincent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="mining">Mining</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <div className="space-y-4">
                <Input
                  placeholder="Sender Address"
                  value={transaction.sender}
                  onChange={(e) =>
                    setTransaction({ ...transaction, sender: e.target.value })
                  }
                />
                <Input
                  placeholder="Recipient Address"
                  value={transaction.recipient}
                  onChange={(e) =>
                    setTransaction({
                      ...transaction,
                      recipient: e.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={transaction.amount}
                  onChange={(e) =>
                    setTransaction({ ...transaction, amount: e.target.value })
                  }
                />
                <Button
                  onClick={handleTransaction}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Submit Transaction"}
                </Button>

                {fraudScore && (
                  <Alert
                    className={fraudScore.anomaly ? "bg-red-50" : "bg-green-50"}
                  >
                    <AlertDescription>
                      {fraudScore.anomaly
                        ? "Warning: This transaction has been flagged as potentially fraudulent."
                        : "Transaction appears legitimate."}{" "}
                      (Score: {fraudScore.error.toFixed(4)}) (
                      {transactionResponse})
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="blockchain">
              <div className="space-y-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chain}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="proof" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  {chain.map((block, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Block {block.index}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          Hash: {block.previous_hash}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          Transactions: {block.transactions.length}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mining">
              <div className="space-y-4">
                <Button onClick={handleMine} className="w-full">
                  Mine New Block
                </Button>
                {mineData && (
                  <Alert
                    className={
                      mineData.message === "The new block has been forged"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }
                  >
                    <AlertDescription className="truncate overflow-hidden whitespace-nowrap text-ellipsis">
                      {mineData.message}{" "}
                      {mineData.message === "The new block has been forged"
                        ? "🎉"
                        : "🔥"}
                      <br />
                      (Proof: {mineData.proof}) (Hash: {mineData.previous_hash})
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contracts">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Contract Owner"
                    value={contractParams.owner}
                    onChange={(e) =>
                      setContractParams({
                        ...contractParams,
                        owner: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Initial Supply"
                    value={contractParams.params.initial_supply}
                    onChange={(e) =>
                      setContractParams({
                        ...contractParams,
                        params: { initial_supply: e.target.value },
                      })
                    }
                  />
                  <Button onClick={handleDeployContract} className="w-full">
                    Deploy Token Contract
                  </Button>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Contract Address"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                  />
                  <Input
                    placeholder="Method Name"
                    value={contractMethod}
                    onChange={(e) => setContractMethod(e.target.value)}
                  />
                  <Input
                    placeholder="Method Parameters (JSON)"
                    value={methodParams}
                    onChange={(e) => setMethodParams(e.target.value)}
                  />
                  <Button onClick={handleExecuteContract} className="w-full">
                    Execute Contract
                  </Button>
                </div>

                <div className="space-y-2">
                  {contracts.map((contract, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Contract: {contract.address}
                        </CardTitle>
                        <CardDescription>
                          Owner: {contract.owner}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(contract.state, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            By: Alex, Aurel, Brians, Julian, Vincent
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BlockchainDashboard;
