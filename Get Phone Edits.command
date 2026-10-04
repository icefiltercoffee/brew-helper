#!/bin/bash
# Double-click to pull changes made from your phone (GitHub) into this folder.
cd "$(dirname "$0")" || exit 1
echo "Getting Brew Helper changes from GitHub..."
if git pull --rebase --autostash origin main; then
  echo; echo "Up to date. You can close this window."
else
  echo; echo "Could not update automatically. Ask Claude to sort it out; nothing was lost."
fi
read -n 1 -s -r -p "Press any key to close"
