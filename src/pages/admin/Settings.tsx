import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeNumber, setStoreNumber] = useState("");
  const [storeComplement, setStoreComplement] = useState("");
  const [storeNeighborhood, setStoreNeighborhood] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeState, setStoreState] = useState("");
  const [storeCep, setStoreCep] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStoreName(data.store_name || "");
        setStoreAddress(data.store_address || "");
        setStoreNumber(data.store_number || "");
        setStoreComplement(data.store_complement || "");
        setStoreNeighborhood(data.store_neighborhood || "");
        setStoreCity(data.store_city || "");
        setStoreState(data.store_state || "");
        setStoreCep(data.store_cep || "");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreCep(formatCep(e.target.value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: storeName,
          store_address: storeAddress,
          store_number: storeNumber,
          store_complement: storeComplement || null,
          store_neighborhood: storeNeighborhood,
          store_city: storeCity,
          store_state: storeState,
          store_cep: storeCep,
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configurações da loja atualizadas.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
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
                  Configurações da Loja
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
                Configurações da Loja
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl shadow-soft border border-border p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-playfair text-xl font-bold text-foreground">
                Endereço da Loja
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Mabel Fashion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeCep">CEP</Label>
                <Input
                  id="storeCep"
                  value={storeCep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress">Endereço</Label>
                <Input
                  id="storeAddress"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Rua, Avenida, etc"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeNumber">Número</Label>
                  <Input
                    id="storeNumber"
                    value={storeNumber}
                    onChange={(e) => setStoreNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeComplement">Complemento</Label>
                  <Input
                    id="storeComplement"
                    value={storeComplement}
                    onChange={(e) => setStoreComplement(e.target.value)}
                    placeholder="Sala 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeNeighborhood">Bairro</Label>
                <Input
                  id="storeNeighborhood"
                  value={storeNeighborhood}
                  onChange={(e) => setStoreNeighborhood(e.target.value)}
                  placeholder="Centro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeCity">Cidade</Label>
                  <Input
                    id="storeCity"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    placeholder="São Luís"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeState">Estado</Label>
                  <Input
                    id="storeState"
                    value={storeState}
                    onChange={(e) => setStoreState(e.target.value.toUpperCase())}
                    placeholder="MA"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
