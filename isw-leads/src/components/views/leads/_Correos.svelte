<script context="module" lang="ts">
   import { TArray } from "@ingenieria_insoft/ispgen";
   import { TLeadCorreo } from "$lib/ispleads/010 Objetos/TLeadCorreo";

   export interface TCorreosProps {
      correos: TArray<TLeadCorreo>;
   }
</script>

<script lang="ts">
   import { Button, ButtonIconify, CheckBox, Iconify, Input, Text } from "@ingenieria_insoft/ispsveltecomponents";
   import { LongitudTextoLargo } from "$lib/const";

   interface $$Props extends TCorreosProps {}

   export let correos: $$Props["correos"];

   // Cada cambio entrega un arreglo nuevo para que Svelte y el formulario padre lo noten.
   // El primer correo que se agrega queda como principal; los demás no
   function agregar(): void {
      const lista: TArray<TLeadCorreo> = new TArray<TLeadCorreo>(correos);
      lista.push(TLeadCorreo.JSONToObject<TLeadCorreo>({ email: "", bprincipal: correos.length === 0 }));
      correos = lista;
   }

   function quitar(indice: number): void {
      const lista: TArray<TLeadCorreo> = new TArray<TLeadCorreo>(correos);
      lista.splice(indice, 1);
      correos = lista;
   }

   // Como máximo un principal: al marcar uno se desmarcan los demás
   function marcarPrincipal(indice: number, bPrincipal: boolean): void {
      const lista: TArray<TLeadCorreo> = new TArray<TLeadCorreo>(correos);
      for (let i: number = 0; i < lista.length; i++) lista[i].bprincipal = bPrincipal && i === indice;
      correos = lista;
   }
</script>

<div class="flex flex-col gap-2">
   <div class="flex items-center justify-between gap-2">
      <Text class="font-semibold">Correos</Text>
      <Button variant="soft" class="w-auto! px-3!" onClick={agregar}>
         <Iconify icon="mdi:add" slot="icon" />
         Agregar correo
      </Button>
   </div>

   {#if correos.length === 0}
      <Text color="neutral" class="text-sm">Este lead aún no tiene correos. Agrega uno para poder registrarle mensajes.</Text>
   {/if}

   {#each correos as Correo, indice (Correo)}
      <div class="flex flex-wrap items-center gap-3 rounded-lg border border-(--is-b-color) bg-(--is-bg-primary) p-2">
         <div class="min-w-56 flex-1">
            <Input label="Correo electrónico" maxLength={LongitudTextoLargo} bind:value={Correo.email} />
         </div>
         <CheckBox checked={Correo.bprincipal} onChange={(bPrincipal: boolean) => marcarPrincipal(indice, bPrincipal)}>Principal</CheckBox>
         <ButtonIconify icon="mdi:trash-can-outline" color="danger" title="Quitar este correo" aria-label="Quitar este correo" onClick={() => quitar(indice)} />
      </div>
   {/each}
</div>
