import React from 'react';
import { renderToString } from 'react-dom/server';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './components/ui/dropdown-menu';

try {
  console.log("Rendering...");
  const html = renderToString(
    <DropdownMenu defaultOpen={true}>
      <DropdownMenuTrigger>Click me</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item 1</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  console.log("Success! HTML length:", html.length);
} catch (err) {
  console.error("Render failed:", err);
}
