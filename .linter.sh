#!/bin/bash
cd /home/kavia/workspace/code-generation/linguatune-32145-dd6dc56a/linguatuune
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

