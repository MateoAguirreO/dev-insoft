<script lang="ts">
   import { Button, H1, Iconify, Input, SelectEnum, Spinner, Text } from "@ingenieria_insoft/ispsveltecomponents";
   import { isBool, val2Int, type TListaPaginacion } from "@ingenieria_insoft/ispgen";
   import { tick } from "svelte";
   import AvisoExito from "$components/display/AvisoExito.svelte";
   import AvisoError from "$components/display/AvisoError.svelte";
   import { TLeadsClient } from "$lib/2.leads/Leads_Lead";
   import { LongitudTextoLargo } from "$lib/const";
   import { TEstadoLead } from "$lib/ispleads/010 Objetos/TEstadoLead";
   import type { TLead } from "$lib/ispleads/010 Objetos/TLead";
   import type { TLeadCorreo } from "$lib/ispleads/010 Objetos/TLeadCorreo";
   import { mensajeError, tomarAviso } from "$lib/utils";

   const Controller: TLeadsClient = new TLeadsClient();

   let texto: string = "";
   let iestado: string = "";
   let pagina: number = 1;
   let Lista: TListaPaginacion<TLead> | undefined = undefined;
   let bCargando: boolean = false;
   let errorCarga: string = "";
   // Solo la última petición actualiza la vista: una respuesta tardía no pisa la vigente
   let consecutivo: number = 0;

   let bConFiltros: boolean;
   $: bConFiltros = isBool(texto.trim()) || val2Int(iestado) > 0;

   // Confirmación que deja la ficha al eliminar; en línea porque el Toaster puede montarse después
   const aviso: string = tomarAviso();

   cargar(1);

   async function cargar(paginaPedida: number): Promise<void> {
      const idPeticion: number = ++consecutivo;
      bCargando = true;
      try {
         const Resultado: TListaPaginacion<TLead> = await Controller.Lista(texto, val2Int(iestado), paginaPedida);
         if (idPeticion !== consecutivo) return;
         Lista = Resultado;
         pagina = val2Int(Resultado.pagina, paginaPedida);
         errorCarga = "";
      } catch (error) {
         if (idPeticion !== consecutivo) return;
         errorCarga = mensajeError(error, "No pudimos cargar tus leads.");
      } finally {
         if (idPeticion === consecutivo) bCargando = false;
      }
   }

   // El select actualiza su valor enlazado y luego avisa: se espera un ciclo para leer el valor nuevo
   async function onCambioEstado(): Promise<void> {
      await tick();
      await cargar(1);
   }

   function correoPrincipal(Lead: TLead): string {
      const correos: Array<TLeadCorreo> = Array.from(Lead.correos);
      const Principal: TLeadCorreo | undefined = correos.find((Correo: TLeadCorreo): boolean => Correo.bprincipal) ?? correos[0];
      return Principal ? Principal.email : "—";
   }
</script>

<section class="flex flex-col gap-4">
   <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
         <H1 color="color" class="text-2xl font-bold">Tus leads</H1>
         <Text color="neutral" class="text-sm">Busca, filtra y abre la ficha de cada lead.</Text>
      </div>
      <a
         href="/leads/nuevo"
         class="flex items-center gap-2 rounded-lg bg-azul-oscuro px-4 py-2 text-sm font-semibold text-white hover:opacity-85"
      >
         <Iconify icon="mdi:account-plus-outline" />
         Nuevo lead
      </a>
   </div>

   <div class="grid grid-cols-1 gap-3 rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-3 md:grid-cols-3">
      <div class="col-span-1 md:col-span-2">
         <Input label="Buscar por nombre o empresa" required={false} maxLength={LongitudTextoLargo} bind:value={texto} onTypingEnd={() => cargar(1)} />
      </div>
      <SelectEnum label="Filtrar por estado" required={false} enumValue={TEstadoLead} bind:value={iestado} onChange={onCambioEstado} />
   </div>

   {#if isBool(aviso)}<AvisoExito mensaje={aviso} />{/if}

   {#if errorCarga && Lista}
      <Text color="error" class="text-sm" role="alert">{errorCarga}</Text>
   {/if}

   {#if !Lista && bCargando}
      <div class="flex flex-col items-center gap-2 py-12">
         <Spinner class="text-2xl" />
         <Text color="neutral" class="text-sm">Cargando tus leads...</Text>
      </div>
   {:else if !Lista}
      <AvisoError mensaje={errorCarga} onReintentar={() => cargar(pagina)} />
   {:else if Lista.datos.length === 0}
      <div class="rounded-lg border border-(--is-b-color) p-8 text-center">
         <Text color="neutral">
            {bConFiltros ? "No encontramos leads con esos filtros. Prueba con otra búsqueda." : "Aún no tienes leads. Crea el primero con «Nuevo lead»."}
         </Text>
      </div>
   {:else}
      <div class="overflow-x-auto rounded-lg border border-(--is-b-color)" class:opacity-60={bCargando}>
         <table class="w-full text-left text-sm">
            <thead class="bg-(--is-bg-secondary) text-xs uppercase text-(--is-color)">
               <tr>
                  <th class="px-3 py-2">Código</th>
                  <th class="px-3 py-2">Nombre</th>
                  <th class="px-3 py-2">Empresa</th>
                  <th class="px-3 py-2">Ciudad</th>
                  <th class="px-3 py-2">Estado</th>
                  <th class="px-3 py-2">Correo principal</th>
                  <th class="px-3 py-2"><span class="sr-only">Acciones</span></th>
               </tr>
            </thead>
            <tbody>
               {#each Lista.datos as Lead (Lead.ilead)}
                  <tr class="border-t border-(--is-b-color) hover:bg-(--is-bg-secondary)">
                     <td class="px-3 py-2">{Lead.ilead}</td>
                     <td class="px-3 py-2">
                        <a href="/leads/{Lead.ilead}" class="font-semibold text-azul-oscuro hover:underline">{Lead.nombre || "Sin nombre"}</a>
                        {#if !Lead.bactivo}<span class="ml-2 rounded bg-(--is-bg-secondary) px-1.5 text-xs">Inactivo</span>{/if}
                     </td>
                     <td class="px-3 py-2">{Lead.empresa || "—"}</td>
                     <td class="px-3 py-2">{Lead.ciudad || "—"}</td>
                     <td class="px-3 py-2">{Lead.iestado > 0 ? TEstadoLead[Lead.iestado] : "—"}</td>
                     <td class="px-3 py-2">{correoPrincipal(Lead)}</td>
                     <td class="px-3 py-2 text-right">
                        <a href="/leads/{Lead.ilead}/mensajes" class="inline-flex items-center gap-1 text-azul-oscuro hover:underline">
                           <Iconify icon="mdi:email-outline" />
                           Mensajes
                        </a>
                     </td>
                  </tr>
               {/each}
            </tbody>
         </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
         <Text color="neutral" class="text-sm">
            Página {pagina} de {Math.max(1, val2Int(Lista.totalpaginas))} · {val2Int(Lista.totalregistros)}
            {val2Int(Lista.totalregistros) === 1 ? "lead" : "leads"}
         </Text>
         <div class="flex gap-2">
            <Button variant="outlined" class="w-auto! px-3!" disabled={bCargando || pagina <= 1} onClick={() => cargar(pagina - 1)}>
               <Iconify icon="mdi:chevron-left" slot="icon" />
               Anterior
            </Button>
            <Button variant="outlined" class="w-auto! px-3!" disabled={bCargando || pagina >= val2Int(Lista.totalpaginas)} onClick={() => cargar(pagina + 1)}>
               Siguiente
               <Iconify icon="mdi:chevron-right" slot="icon" />
            </Button>
         </div>
      </div>
   {/if}
</section>
