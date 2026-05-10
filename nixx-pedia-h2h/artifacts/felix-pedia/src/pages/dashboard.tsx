import { AppLayout } from "@/components/layout";
import { useGetDashboardSummary, useGetMe, useListTransactions, useRegenerateApiKey, useCreateQrisDeposit, useCreateWithdrawal, getGetMeQueryKey, getGetDashboardSummaryQueryKey, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/format";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Key, FileCode2, Copy, RefreshCw, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const qrisSchema = z.object({
  amount: z.coerce.number().min(1000, "Minimum deposit is Rp 1.000"),
});

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(10000, "Minimum withdrawal is Rp 10.000"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(5, "Account number is required"),
  accountName: z.string().min(3, "Account name is required"),
});

export default function DashboardPage() {
  const { data: user } = useGetMe();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: transactions, isLoading: isLoadingTx } = useListTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [qrisDialogOpen, setQrisDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [qrisResult, setQrisResult] = useState<{qrData: string, transactionId: number} | null>(null);

  const regenerateKeyMutation = useRegenerateApiKey();
  const createQrisMutation = useCreateQrisDeposit();
  const createWithdrawalMutation = useCreateWithdrawal();

  const qrisForm = useForm<z.infer<typeof qrisSchema>>({
    resolver: zodResolver(qrisSchema),
    defaultValues: { amount: 10000 },
  });

  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { amount: 50000, bankName: "", accountNumber: "", accountName: "" },
  });

  const handleCopyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast({ title: "API Key copied to clipboard" });
    }
  };

  const handleRegenerateKey = () => {
    if (confirm("Are you sure you want to regenerate your API Key? All existing integrations will stop working.")) {
      regenerateKeyMutation.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "API Key regenerated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      });
    }
  };

  const onSubmitQris = (data: z.infer<typeof qrisSchema>) => {
    createQrisMutation.mutate({ data }, {
      onSuccess: (res) => {
        setQrisResult({ qrData: res.qrData, transactionId: res.transactionId });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "QRIS Generated successfully" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error generating QRIS", description: err.message });
      }
    });
  };

  const onSubmitWithdrawal = (data: z.infer<typeof withdrawalSchema>) => {
    createWithdrawalMutation.mutate({ data }, {
      onSuccess: () => {
        setWithdrawDialogOpen(false);
        withdrawalForm.reset();
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Withdrawal requested successfully" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Withdrawal failed", description: err.message });
      }
    });
  };

  const recentTx = transactions?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        
        {/* Header section with Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shadow-xl shadow-primary/10">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Wallet className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Available Balance</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                      {user ? formatRupiah(user.balance) : "Rp 0"}
                    </h2>
                  </div>
                  <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/30 uppercase">
                    {user?.role || "user"}
                  </Badge>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-gray-700/50 mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Total Deposit</p>
                    <p className="font-semibold">{summary ? formatRupiah(summary.totalDeposit) : "Rp 0"}</p>
                  </div>
                  <div className="w-px bg-gray-700/50 mx-2" />
                  <div>
                    <p className="text-xs text-gray-400">Total Withdrawal</p>
                    <p className="font-semibold">{summary ? formatRupiah(summary.totalWithdrawal) : "Rp 0"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Menu */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
            <Dialog open={qrisDialogOpen} onOpenChange={(open) => {
              setQrisDialogOpen(open);
              if (!open) {
                setQrisResult(null);
                qrisForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-700 hover:text-primary shadow-sm hover:shadow-md">
                  <ArrowDownToLine className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Top Up</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Top Up via QRIS</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to deposit. Minimum is Rp 1.000.
                  </DialogDescription>
                </DialogHeader>
                
                {qrisResult ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                      {qrisResult.qrData.startsWith('http') || qrisResult.qrData.startsWith('data:image') ? (
                        <img src={qrisResult.qrData} alt="QRIS Code" className="w-64 h-64 object-contain" />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-gray-50 text-center text-xs text-gray-500 break-all p-4 border border-dashed rounded-lg">
                          QR string data: {qrisResult.qrData}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Scan this QR code with any supported e-wallet or banking app.
                    </p>
                    <p className="text-xs text-gray-400">Transaction ID: {qrisResult.transactionId}</p>
                  </div>
                ) : (
                  <Form {...qrisForm}>
                    <form onSubmit={qrisForm.handleSubmit(onSubmitQris)} className="space-y-4 py-4">
                      <FormField
                        control={qrisForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (Rp)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="10000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" className="w-full" disabled={createQrisMutation.isPending}>
                          {createQrisMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Generate QRIS
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-700 hover:text-primary shadow-sm hover:shadow-md">
                  <ArrowUpFromLine className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">Withdraw</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Request a withdrawal to your bank account. Minimum is Rp 10.000.
                  </DialogDescription>
                </DialogHeader>
                <Form {...withdrawalForm}>
                  <form onSubmit={withdrawalForm.handleSubmit(onSubmitWithdrawal)} className="space-y-4 py-4">
                    <FormField
                      control={withdrawalForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (Rp)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawalForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="BCA / Mandiri / GoPay" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawalForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawalForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full" disabled={createWithdrawalMutation.isPending}>
                        {createWithdrawalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-gray-700 hover:text-primary shadow-sm hover:shadow-md col-span-2">
              <FileCode2 className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Integration Docs</span>
            </button>
          </div>
        </div>

        {/* API Key Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>API Key Management</CardTitle>
            </div>
            <CardDescription>
              Use this key to authenticate your server-to-server requests. Keep it secret.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Input 
                  type={showApiKey ? "text" : "password"} 
                  value={user?.apiKey || ""} 
                  readOnly 
                  className="pr-24 font-mono text-sm bg-gray-50"
                />
                <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1 bg-gray-50 px-1 rounded-md border border-transparent">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={handleCopyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleRegenerateKey} disabled={regenerateKeyMutation.isPending}>
                {regenerateKeyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate
              </Button>
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p>Include this key in the <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-xs">x-api-key</code> header for all API requests.</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              {transactions && transactions.length > 0 && (
                <Button variant="link" className="text-primary p-0 h-auto" onClick={() => window.location.href = "/transactions"}>
                  View all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTx ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : recentTx.length === 0 ? (
              <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg bg-gray-50">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </p>
                      <Badge variant="outline" className={`mt-1 text-[10px] uppercase
                        ${tx.status === 'success' ? 'border-green-200 text-green-700 bg-green-50' : 
                          tx.status === 'failed' ? 'border-red-200 text-red-700 bg-red-50' : 
                          'border-yellow-200 text-yellow-700 bg-yellow-50'}`}>
                        {tx.status}
                      </Badge>
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
