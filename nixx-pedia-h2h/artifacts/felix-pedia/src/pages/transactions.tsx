import { AppLayout } from "@/components/layout";
import { useListTransactions } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, ListFilter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useListTransactions();

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Transaction History</h1>
            <p className="text-gray-500 mt-1">View all your deposits and withdrawals.</p>
          </div>
        </div>

        <Card className="shadow-sm border-0">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">All Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : transactions?.length === 0 ? (
              <div className="text-center p-12 text-gray-500 bg-gray-50">
                <p>No transactions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions?.map((tx) => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine className="h-6 w-6" /> : <ArrowUpFromLine className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 capitalize text-lg">{tx.type}</p>
                          <Badge variant="outline" className={`text-[10px] uppercase h-5
                            ${tx.status === 'success' ? 'border-green-200 text-green-700 bg-green-50' : 
                              tx.status === 'failed' ? 'border-red-200 text-red-700 bg-red-50' : 
                              'border-yellow-200 text-yellow-700 bg-yellow-50'}`}>
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{formatDate(tx.createdAt)}</p>
                        <p className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded inline-block">ID: #{tx.id}</p>
                      </div>
                    </div>
                    
                    <div className="sm:text-right pl-16 sm:pl-0">
                      <p className={`font-bold text-xl ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </p>
                      {tx.description && (
                        <p className="text-sm text-gray-500 mt-1 max-w-[250px] truncate sm:ml-auto">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
