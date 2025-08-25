import BottomDock from "@components/bottom-dock";

export default function SettingsPage() {
  return (
    <main class="min-h-screen w-screen bg-background text-foreground px-6 py-6 pb-24">
      <h1 class="text-3xl font-semibold mb-4">Settings</h1>
      <p class="text-sm text-zinc-500">Coming soon.</p>
      <a
        href="/"
        class="mt-8 inline-block text-sm text-zinc-400 hover:text-zinc-200"
      >
        ← Back
      </a>
      <BottomDock />
    </main>
  );
}
