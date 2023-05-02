# Repository Topic Crawler

This Javascript is used to filter repositories by a specific topic and then look for a file in a specific path to analyze.
Once all repository files are found a `data.json` file is created and uploaded as an artifact as part of the action execution.

## A Node.js script + action yaml

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
[
  {
    "topic": "innersource-ml",
    "repos": [
      {
        "name": "va-innersource-ml-template",
        "models": [
          {
            "name": "masterblaster-ml",
            "description": "This model conducts machine learning for cancer studies",
            "path": "masterblaster-ml/models",
            "language": "Matlab",
            "framework": "TenserFlow"
          },
          {
            "name": "skywalker-ml",
            "description": "This model conducts machine learning for walking studies",
            "path": "skywalker-ml/models",
            "language": "Python",
            "framework": "PyTorch"
          },
          {
            "name": "sundial-ml",
            "description": "This model conducts machine learning for solar energy",
            "path": "sundial-ml/models",
            "language": "R, MatLab",
            "framework": "PyTorch"
          },
          {
            "name": "windmill-ml",
            "description": "This model conducts machine learning for wind energy",
            "path": "windmill-ml/models",
            "language": "Python",
            "framework": "Tensorflow, Spark, PyTorch"
          }
        ]
      },
      {
        "name": "va-innersource-ml-template-2",
        "models": [
          {
            "name": "masterblaster2-ml",
            "description": "This model conducts machine learning for 2 cancer studies",
            "path": "masterblaster2-ml/models",
            "language": "Matlab",
            "framework": "TenserFlow"
          },
          {
            "name": "skywalker2-ml",
            "description": "This model conducts machine learning for 2 walking studies",
            "path": "skywalker2-ml/models",
            "language": "Python",
            "framework": "PyTorch"
          },
          {
            "name": "sundial2-ml",
            "description": "This model conducts machine learning for 2 solar energy",
            "path": "sundial2-ml/models",
            "language": "R",
            "framework": "PyTorch"
          },
          {
            "name": "windmill2-ml",
            "description": "This model conducts machine learning for 2 wind energy",
            "path": "windmill2-ml/models",
            "language": "Python",
            "framework": "Tensorflow"
          }
        ]
      }
    ]
  }
]
```
