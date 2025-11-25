import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Tag, AlertCircle, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons((data as Coupon[]) || []);
    } catch (error) {
      console.error("Erro ao buscar cupons:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !discountValue || !expiresInHours) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const numericValue = parseFloat(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do desconto deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (discountType === "percentage" && numericValue > 100) {
      toast({
        title: "Valor inválido",
        description: "A porcentagem não pode ser maior que 100%.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours));

      const { error } = await supabase.from("coupons").insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: numericValue,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Cupom criado!",
        description: `Cupom ${code.toUpperCase()} criado com sucesso.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error("Erro ao criar cupom:", error);
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um cupom com este código.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o cupom.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleActive = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !currentStatus })
        .eq("id", couponId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Cupom ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      });

      fetchCoupons();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", couponId);

      if (error) throw error;

      toast({
        title: "Cupom deletado",
        description: "Cupom removido com sucesso.",
      });

      fetchCoupons();
    } catch (error) {
      console.error("Erro ao deletar cupom:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o cupom.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setExpiresInHours("24");
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-playfair text-2xl font-bold text-foreground">
                Gerenciar Cupons
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Cupom
                </Button>
              </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateCoupon}>
              <DialogHeader>
                <DialogTitle className="font-playfair text-2xl">Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cupom de desconto
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom *</Label>
                  <Input
                    id="code"
                    placeholder="Ex: DESCONTO10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipo de Desconto *</Label>
                  <Select value={discountType} onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Valor do Desconto * {discountType === "percentage" ? "(%)" : "(R$)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountType === "percentage" ? "100" : undefined}
                    placeholder={discountType === "percentage" ? "Ex: 10" : "Ex: 50.00"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresInHours">Válido por (horas) *</Label>
                  <Input
                    id="expiresInHours"
                    type="number"
                    min="1"
                    placeholder="Ex: 24"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    O cupom expirará após este período
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Cupom</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </header>

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
          <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-2">
            Nenhum cupom cadastrado
          </h2>
          <p className="text-muted-foreground font-inter">
            Crie seu primeiro cupom de desconto
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar cupons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
              <p className="text-muted-foreground font-inter">
                Nenhum cupom encontrado com "{searchQuery}"
              </p>
            </div>
          ) : (
            <>
            {/* Mobile Cards */}
            <div className="block sm:hidden space-y-4">
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expires_at);
                return (
                  <Card key={coupon.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-mono font-semibold text-lg">{coupon.code}</p>
                          <p className="text-foreground font-inter font-medium">
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}%`
                              : `R$ ${coupon.discount_value.toFixed(2)}`}
                          </p>
                        </div>
                          <div>
                            {expired ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expirado
                              </Badge>
                            ) : coupon.is_active ? (
                              <Badge variant="default">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground font-inter">
                        Expira em: {format(new Date(coupon.expires_at), "dd/MM/yyyy HH:mm")}
                      </div>
                      <div className="flex gap-2 pt-2">
                        {!expired && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                          >
                            {coupon.is_active ? "Desativar" : "Ativar"}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border">
                      <TableHead className="font-inter font-semibold text-foreground">Código</TableHead>
                      <TableHead className="font-inter font-semibold text-foreground">Desconto</TableHead>
                      <TableHead className="font-inter font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-inter font-semibold text-foreground">Expira em</TableHead>
                      <TableHead className="text-right font-inter font-semibold text-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon) => {
                      const expired = isExpired(coupon.expires_at);
                      return (
                        <TableRow key={coupon.id} className="border-b border-border hover:bg-muted/30">
                          <TableCell className="font-mono font-semibold text-foreground">
                            {coupon.code}
                          </TableCell>
                          <TableCell className="font-inter font-semibold text-primary">
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}%`
                              : `R$ ${coupon.discount_value.toFixed(2)}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {expired ? (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Expirado
                                </Badge>
                              ) : coupon.is_active ? (
                                <Badge variant="default">Ativo</Badge>
                              ) : (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-inter text-muted-foreground">
                            {format(new Date(coupon.expires_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!expired && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                                >
                                  {coupon.is_active ? "Desativar" : "Ativar"}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
          )}
        </>
      )}
    </div>
    </div>
  );
};

export default CouponsManagement;