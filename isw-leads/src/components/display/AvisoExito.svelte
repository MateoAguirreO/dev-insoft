<script context="module" lang="ts">
   import type { HTMLAttributes } from "svelte/elements";

   export interface TAvisoExitoProps extends HTMLAttributes<HTMLDivElement> {
      mensaje: string;
   }
</script>

<script lang="ts">
   import { ButtonIconify, Iconify, Text } from "@ingenieria_insoft/ispsveltecomponents";

   interface $$Props extends TAvisoExitoProps {}

   export let mensaje: $$Props["mensaje"] = "";

   let bVisible: boolean = true;
</script>

<!-- Confirmación en línea de una acción que terminó bien; el usuario la puede cerrar -->
{#if bVisible}
   <div
      role="status"
      class="flex items-center gap-2 rounded-lg border border-(--is-success) bg-(--is-bg-primary) px-3 py-2 {$$props.class ?? ''}"
      style={$$props.style ?? ""}
   >
      <Iconify icon="mdi:check-circle-outline" class="text-lg text-(--is-success)" />
      <Text class="flex-1 text-sm">{mensaje}</Text>
      <ButtonIconify icon="mdi:close" color="neutral" title="Cerrar aviso" aria-label="Cerrar aviso" onClick={() => (bVisible = false)} />
   </div>
{/if}
