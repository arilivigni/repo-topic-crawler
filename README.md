# Repository Topic Crawler

This Javascript is used to filter repositories by a specific topic and then look for a file in a specific path to analyze.
Once all repository files are found a `data.json` file is created and uploaded as an artifact as part of the action execution.

## A Node.js scipt + action yaml

- index.js
- action.yml

### Inputs

This Javascript takes four inputs

- `admin_token` - token with access to repositories metadata and topics
- `org` - organization that contains the repositories of interest
- `repo_topic` - repository topic filter
- `repo_file` - path to the repository file to be analyzed

### Outputs

The output generated from all files found is `data.json` file.

```json
{
  "<rep_topic>": [
    "<repository_name>":,
    {
        ...
    }
  ]
}
```

#### Example `data.json` file

```json
{
  "innersource-ml": [
    "achme-innersource-ml",
    {
      "models": [
        {
          "name": "masterblaster-ml",
          "description": "This repository conducts machine learning for cancer studies",
          "path": "masterblaster-ml/models",
          "language": "Matlab",
          "framework": "TenserFlow"
        },
        {
          "name": "skywalker-ml",
          "description": "This repository conducts machine learning for walking studies",
          "path": "skywalker-ml/models",
          "language": "Python",
          "framework": "PyTorch"
        }
      ]
    },
    "foo-innsersource-ml",
    {
      "models": [
        {
          "name": "killswitch-ml",
          "description": "This repository conducts machine learning for oil production",
          "path": "killswitch-ml/models",
          "language": "Matlab",
          "framework": "AML"
        },
        {
          "name": "chainlink-ml",
          "description": "This repository conducts machine learning for block chain",
          "path": "chainlink-ml/models",
          "language": "Python",
          "framework": "Spark"
        }
      ]
    },
    "bar-innersource-ml",
    {
      "models": [
        {
          "name": "sundial-ml",
          "description": "This repository conducts machine learning for solar energy",
          "path": "sundial-ml/models",
          "language": "R",
          "framework": "PyTorch"
        },
        {
          "name": "windmill-ml",
          "description": "This repository conducts machine learning for wind energy",
          "path": "windmill-ml/models",
          "language": "Python",
          "framework": "Tensorflow"
        }
      ]
    }
  ]
}
```
