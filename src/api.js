export async function getCurrentUser() {
  const response = await fetch('https://api.github.com/user',
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }});
  return response.json();
}
export async function userExists(login) {
  const response = await fetch(`https://api.github.com/users/${login}`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
    }});
  return response.json();
}
export async function orgExists(login) {
  const response = await fetch(`https://api.github.com/orgs/${login}`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
    }});
  return response.json();
}
export async function checkOwner(owner) {
  const isOrg = await orgExists(owner);
  if (isOrg.login) {
    const member = await checkMembership(window.sessionStorage.getItem('user'), owner);
    if (member) {
      return 'organization';
    } else {
      return false;
    }
  }
  const isUser = await userExists(owner);
  if (isUser.login) {
    return 'user';
  }
  return false;
}
export async function checkMembership(user, org) {
  const response = await fetch(`https://api.github.com/orgs/${org}/members/${user}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }
  });
  return response.status == 204;
}
export async function getRepos(owner, page) {
  const response = await fetch('https://api.github.com/graphql', { 
    method: 'POST',
    headers: {
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    },
    body: `{	"query": "query {repositoryOwner(login:\\"${owner}\\") {repositories(first: 100, isFork: true${page}) {pageInfo {startCursor, hasNextPage, endCursor}, totalCount,nodes {name parent {nameWithOwner}}}}}"}`
  });
  return response.json();
}
export async function getBranch(owner, repo, branch) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token'),
    }});
  return response.json();
}
export async function createRef(ref, sha) {
  ref = encodeURIComponent(ref);
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token'),
    },
    body: `{"ref":"refs/heads/${ref}", "sha":"${sha}"}`
  });
  return response.json();
}
export async function updateRef(ref, sha) {
  ref = encodeURIComponent(ref);
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token'),
    },
    body: `{"sha":"${sha}"}`
  });
  return response.json();
}
export async function getCollaborators(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token'),
    }});
    return response.json();
}
export async function forkTEIRepo(organization) {
  const body = organization ? `"organization": "${organization}"` : '';
  const response = await fetch(`https://api.github.com/repos/TEIC/TEI/forks`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token'),
    },
    body: `{${body}}`
  });
  return response.json();
}
export async function deleteUnprotectedBranches(owner, repo) {
  const branches = await getBranches(owner, repo);
  for (const branch of branches ) {
    if (!['dev','released'].includes(branch.name)) {
      deleteRef(owner, repo, branch.name);
    }
  }
}
export async function deleteRef(owner, repo, ref) {
  ref = encodeURIComponent(ref);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }
  });
  return response.ok;
}
// TODO: Could potentially force this if there's a merge conflict.
// 1) Get spec_lists.json from TEIC/TEI:dev
// 2) Overwrite it in current branch
// 3) Redo the merge
// 4) Put the old spec_lists back
export async function mergeUpstream(owner, repo, branch='dev') {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/merge-upstream`,
    { method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{"branch":"${branch}"}`
    });
  return response.status;
}
export async function getBranches(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }});
  return response.json();
}
// Get branches that do not match branch names in TEIC/TEI
export function getUniqueRepoBranches(owner, repo) {
  const result = getBranches('TEIC','TEI').then(TEIBranches => {
    const names = TEIBranches.map(b => b.name);
    const uniqueBranches = getBranches(owner, repo).then(branches => {
      return branches.filter(branch => !names.includes(branch.name));
    });
    return uniqueBranches;
  });
  return result;
}
export async function getTEIRepo(owner, acc = [], page = '') {
  const json = await getRepos(owner, page);
  acc.push(...json.data.repositoryOwner.repositories.nodes.filter(repo => repo.parent.nameWithOwner == 'TEIC/TEI'));
  if (json.data.repositoryOwner.repositories.pageInfo.hasNextPage) {
    return getTEIRepo(owner, acc, `,after:"${json.data.repositoryOwner.repositories.pageInfo.endCursor}")`);
  } else {
    return acc[0];
  }
}
export async function verifyTEIRepo(owner, name) {
  const data = `{\n query { \n repository(owner:"${owner}", name"${name}") \n parent {\n nameWithOwner\n }\n }\n }`;
  const response = await fetch('https://api.github.com/graphql', { 
    method: 'POST',
    headers: {
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
  }});
  return response.json();
}
export async function getPRForBranch(owner, branch) {
  const response = await fetch(`https://api.github.com/repos/TEIC/TEI/pulls?head=${owner}:${branch}`,
    { headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }});
  return response.json();
}

// COMMITS
export async function createBlob(blob) {
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  try {
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{"content":${JSON.stringify(blob)}, "encoding":"utf-8"}`
    }));
    return response.json();
  } catch (e) {
    console.log(e);
    return {message: "Exception thrown"};
  }
}
export async function getCommit(owner, repo, sha) {
  const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${sha}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }
  }));
  return response.json();
}
export async function getTree(owner, repo, sha) {
  const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=true`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }
  }));
  return response.json();
}
export async function getBlobSHA(owner, repo, branchname, path) {
  // Get HEAD of current branch
  const branch = await getBranch(owner, repo, branchname);
  // Get its commit -> head
  const head = branch.commit.sha;
  // get the full tree listing for head.tree
  const trees = await getTree(owner, repo, branch.commit.commit.tree.sha);
  return trees.tree.find(tree => tree.path == path).sha;
}
export async function getBlobContent(owner, repo, branch, path) {
  const p = path.match(/\//) ? path : 'P5/Source/Specs/' + path;
  const sha = await getBlobSHA(owner, repo, branch, p);
  const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }
  }));
  const json = await response.json();
  return b64Decode(json.content);
}
export function b64Decode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
export async function createTree(base, path, sha, blob) {
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  const mode = blob ? '100644' : '040000';
  const type = blob ? 'blob' : 'tree';
  try {
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{"tree":[{"path":"${path}", "mode":"${mode}", "type":"${type}", "sha":"${sha}"}], "base_tree":"${base}"}`
    }));
    return response.json();
  } catch (e) {
    console.log(e);
    return {message: "Exception thrown"};
  }
}
export async function createCommit(message, tree, parent) {
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  try {
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{"message":"${message}", "tree":"${tree}", "parents":["${parent}"]}`
    }));
    return response.json();
  } catch (e) {
    console.log(e);
    return {message: "Exception thrown"};
  }
}
export async function buildTree(trees, path, file, sha, blob) {
  const old_sha = trees.tree.find(tree => tree.path == path).sha;
  return await createTree(old_sha, file, sha, blob);
}
export async function commit(file, content, message) {
  const owner = window.sessionStorage.getItem('owner');
  const repo = window.sessionStorage.getItem('repo');
  const branchname = window.sessionStorage.getItem('branch');
  // Get HEAD of current branch
  const branch = await getBranch(owner, repo, branchname);
  // Get its commit -> head
  const head = branch.commit.sha;
  // save the content createBlob() -> blob_sha
  const blob = await createBlob(content);
  // get the full tree listing for head.tree
  const trees = await getTree(owner, repo, branch.commit.commit.tree.sha);
  // get the tree for the new blob's path -> old_blob_tree_sha
  let path = (file.match(/\//) ? file : 'P5/Source/Specs/' + file).replace(/\/[^\/]+$/,'').split('/');
  let tree = await buildTree(trees, path.join('/'), file.replace(/.+\/([^\/]+)$/, "$1"), blob.sha, true);
  let folder = path.pop();
  while (path.length > 0) {
    tree = await buildTree(trees, path.join('/'), folder, tree.sha, false);
    folder = path.pop();
  }
  tree = await createTree(branch.commit.commit.tree.sha, folder, tree.sha, false);
  // create new commit (parents:[head], message, tree:P5_sha) -> new_head
  const new_head = await createCommit(message, tree.sha, head);
  // update branch ref to new_head
  return await updateRef(branchname, new_head.sha);
}
export async function createPullRequest(message) {
  const owner = window.sessionStorage.getItem('owner');
  const branch = window.sessionStorage.getItem('branch');
  const response = await(fetch(`https://api.github.com/repos/TEIC/TEI/pulls`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + window.sessionStorage.getItem('token')
    },
    body: `{"head":"${owner}:${branch}", "base":"dev", "title":"${message}"}`
  }));
  return response.json();
}
