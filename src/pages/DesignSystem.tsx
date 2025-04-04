import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ModernHeader } from "@/components/layout/modern";
import PageWrapper from "@/components/layout/PageWrapper";
import { UserIcon, BellIcon, Palette, Layout, Table2, Calendar, FileText, CheckCircle2, ListFilter } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ModernDateRangeFilter, { DateFilterRange } from "@/components/ui/ModernDateRangeFilter";
import { useState } from "react";
import ModernForm from "@/components/layout/modern/ModernForm";

export default function DesignSystem() {
    const [selectedDateRange, setSelectedDateRange] = useState<DateFilterRange>('today');
    const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({
        from: new Date(),
        to: undefined,
    });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const handleDateRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
        setSelectedDateRange(range);
        if (dates) {
            setCustomDateRange(dates);
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    return (
        <PageWrapper>
            <div className="flex flex-col gap-8">
                <ModernHeader
                    title="Design System"
                    subtitle="Documentação de componentes e estilos padronizados do StashKeeper Pro"
                    actions={<Button type="button">Ação Primária</Button>}
                />

                <Tabs defaultValue="components" className="w-full">
                    <div className="border-b mb-4">
                        <div className="flex overflow-x-auto py-2">
                            <TabsTrigger value="components" className="flex items-center gap-2">
                                <Layout size={16} />
                                <span>Componentes</span>
                            </TabsTrigger>
                            <TabsTrigger value="typography" className="flex items-center gap-2">
                                <FileText size={16} />
                                <span>Tipografia</span>
                            </TabsTrigger>
                            <TabsTrigger value="colors" className="flex items-center gap-2">
                                <Palette size={16} />
                                <span>Cores</span>
                            </TabsTrigger>
                        </div>
                    </div>

                    <TabsContent value="components" className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">ModernHeader</h2>
                            <Card>
                                <CardContent className="pt-6">
                                    <ModernHeader
                                        title="Exemplo de Header"
                                        subtitle="Este é um exemplo do componente ModernHeader"
                                        actions={<Button type="button" size="sm">Ação</Button>}
                                    />
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Cards</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Título do Card</CardTitle>
                                        <CardDescription>Esta é a descrição do card com informações adicionais</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Conteúdo principal do card com informações importantes.</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        <Button type="button" variant="outline">Cancelar</Button>
                                        <Button type="button">Salvar</Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Card com Formulário</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome</Label>
                                            <Input id="name" placeholder="Digite seu nome" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" placeholder="exemplo@empresa.com" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button type="button">Enviar</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Formulários</h2>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Elementos de Formulário</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="input-example">Input Padrão</Label>
                                            <Input id="input-example" placeholder="Digite aqui" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="input-disabled">Input Desabilitado</Label>
                                            <Input id="input-disabled" disabled value="Não editável" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="switch1">Notificações</Label>
                                            <Switch id="switch1" />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="switch2">Modo Escuro</Label>
                                            <Switch id="switch2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">ModernForm</h2>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Formulário Modernizado</CardTitle>
                                    <CardDescription>Componente padronizado para formulários</CardDescription>
                                </CardHeader>
                                <CardContent className="py-6">
                                    <ModernForm className="max-w-lg" preventDefaultSubmit={true} onSubmit={(e) => console.log('Formulário submetido')}>
                                        <ModernForm.Group>
                                            <Label htmlFor="name">Nome completo</Label>
                                            <Input id="name" placeholder="Digite seu nome" />
                                        </ModernForm.Group>

                                        <ModernForm.Group>
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" placeholder="seu@email.com" />
                                        </ModernForm.Group>

                                        <ModernForm.Group className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <ModernForm.Field>
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input id="phone" placeholder="(00) 00000-0000" />
                                            </ModernForm.Field>

                                            <ModernForm.Field>
                                                <Label htmlFor="department">Departamento</Label>
                                                <Input id="department" placeholder="Vendas" />
                                            </ModernForm.Field>
                                        </ModernForm.Group>

                                        <ModernForm.Group className="flex items-center justify-between">
                                            <Label htmlFor="active">Usuário ativo</Label>
                                            <Switch id="active" />
                                        </ModernForm.Group>

                                        <ModernForm.Actions>
                                            <Button type="submit">Salvar alterações</Button>
                                            <Button type="button" variant="outline">Cancelar</Button>
                                        </ModernForm.Actions>
                                    </ModernForm>
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Botões</h2>
                            <Card>
                                <CardContent className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <Button type="button">Primário</Button>
                                        <span className="text-sm text-muted-foreground">Default</span>
                                    </div>

                                    <div className="flex flex-col gap-2 items-center">
                                        <Button type="button" variant="secondary">Secundário</Button>
                                        <span className="text-sm text-muted-foreground">Secondary</span>
                                    </div>

                                    <div className="flex flex-col gap-2 items-center">
                                        <Button type="button" variant="outline">Outline</Button>
                                        <span className="text-sm text-muted-foreground">Outline</span>
                                    </div>

                                    <div className="flex flex-col gap-2 items-center">
                                        <Button type="button" variant="destructive">Deletar</Button>
                                        <span className="text-sm text-muted-foreground">Destructive</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">ModernDateRangeFilter</h2>
                            <Card>
                                <CardContent className="py-6">
                                    <ModernDateRangeFilter
                                        selectedRange={selectedDateRange}
                                        customDateRange={customDateRange}
                                        onRangeSelect={handleDateRangeSelect}
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                        placeholder="Filtrar por período"
                                    />
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Tabela</h2>
                            <Card>
                                <CardContent className="py-6">
                                    <div className="border rounded-md">
                                        <div className="grid grid-cols-4 border-b bg-muted/50 px-4 py-3">
                                            <div className="font-medium">Nome</div>
                                            <div className="font-medium">Email</div>
                                            <div className="font-medium">Status</div>
                                            <div className="font-medium text-right">Ações</div>
                                        </div>
                                        <div className="grid grid-cols-4 px-4 py-3 border-b">
                                            <div className="flex items-center gap-2">
                                                <UserIcon size={16} />
                                                <span>Carlos Silva</span>
                                            </div>
                                            <div>carlos@exemplo.com</div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 size={16} className="text-green-500" />
                                                <span>Ativo</span>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" size="sm">Editar</Button>
                                                <Button type="button" variant="destructive" size="sm">Excluir</Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <UserIcon size={16} />
                                                <span>Ana Souza</span>
                                            </div>
                                            <div>ana@exemplo.com</div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 size={16} className="text-green-500" />
                                                <span>Ativo</span>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" size="sm">Editar</Button>
                                                <Button type="button" variant="destructive" size="sm">Excluir</Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </TabsContent>

                    <TabsContent value="typography" className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tipografia</CardTitle>
                                <CardDescription>Hierarquia de texto e estilos tipográficos</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">Título Principal (H1)</h1>
                                    <p className="text-muted-foreground">text-4xl font-bold</p>
                                </div>
                                <Separator />
                                <div>
                                    <h2 className="text-3xl font-semibold mb-2">Título Secundário (H2)</h2>
                                    <p className="text-muted-foreground">text-3xl font-semibold</p>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-2xl font-semibold mb-2">Título Terciário (H3)</h3>
                                    <p className="text-muted-foreground">text-2xl font-semibold</p>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-xl font-medium mb-2">Subtítulo (H4)</h4>
                                    <p className="text-muted-foreground">text-xl font-medium</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-base mb-2">Texto normal (Parágrafo)</p>
                                    <p className="text-muted-foreground">text-base</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Texto pequeno (Observações)</p>
                                    <p className="text-muted-foreground">text-sm text-muted-foreground</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="colors" className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Paleta de Cores</CardTitle>
                                <CardDescription>Cores principais utilizadas no sistema</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Cores Primárias</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-primary"></div>
                                                <span>Primary</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-primary-foreground"></div>
                                                <span>Primary Foreground</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-secondary"></div>
                                                <span>Secondary</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-secondary-foreground"></div>
                                                <span>Secondary Foreground</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Estados e Feedback</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-destructive"></div>
                                                <span>Destructive</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-muted"></div>
                                                <span>Muted</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-accent"></div>
                                                <span>Accent</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-background"></div>
                                                <span>Background</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageWrapper>
    );
} 