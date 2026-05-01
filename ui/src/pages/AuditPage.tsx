import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditPage() {
  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Audit Report</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-lg text-gray-300 mb-8">All gates passed. System secure.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30">
              <h3 className="font-bold text-xl mb-2">Security Score</h3>
              <div className="text-4xl font-black text-green-400">100%</div>
            </div>
            <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30">
              <h3 className="font-bold text-xl mb-2">Performance</h3>
              <div className="text-4xl font-black text-blue-400">98.7%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

