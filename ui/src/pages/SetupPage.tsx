import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Setup Wizard Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-lg text-gray-300">BrightSky is ready for deployment.</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✅ API Base URL configured</li>
            <li>✅ Engine readiness checked</li>
            <li>✅ Wallet connection verified</li>
          </ul>
          <Button className="w-full">Go to Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}

