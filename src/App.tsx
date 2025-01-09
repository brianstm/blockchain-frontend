import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function App() {
  return (
    <div className="w-96 mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Hackerman</CardTitle>
          <CardDescription>NUS Fintech Summit 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Smart Blockchiain</p>
        </CardContent>
        <CardFooter>
          <p>By: Alex, Aurel, Brians, Julian, Vincent</p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
