suppressMessages(library(QCA))
toj <- function(x){
  if (is.null(x)) return("null")
  if (is.list(x)) { nm <- names(x); items <- sapply(seq_along(x), function(i) toj(x[[i]]))
    if (!is.null(nm) && all(nm!="")) return(paste0("{", paste0('"', nm, '":', items, collapse=","), "}")) else return(paste0("[", paste(items, collapse=","), "]")) }
  if (is.character(x)) { v <- paste0('"', gsub('"','\\\\"',x), '"') } else { v <- ifelse(is.na(x), "null", format(x, digits=15, scientific=FALSE)) }
  if (length(x)==1 && is.null(attr(x,"arr"))) v else paste0("[", paste(v, collapse=","), "]")
}
arr <- function(x){ attr(x,"arr") <- TRUE; x }
man <- read.delim("manifest.tsv", stringsAsFactors=FALSE, colClasses="character")
run_case <- function(s) {
  id <- as.integer(s$id); file <- s$file; outc <- s$outcome; conds <- strsplit(s$conditions, ",")[[1]]
  neg <- s$negate=="1"; incl <- as.numeric(s$incl); pri <- as.numeric(s$pri); freq <- as.numeric(s$freq); dir <- strsplit(s$dir, ",")[[1]]
  cat(id, ""); flush.console(); d <- read.csv(file)
  o <- if (neg) paste0("~",outc) else outc
  res <- list(id=id)
  tt <- tryCatch(truthTable(d, outcome=o, conditions=paste(conds,collapse=","), incl.cut=incl, pri.cut=pri, n.cut=freq, complete=TRUE, show.cases=FALSE), error=function(e) NULL)
  if (is.null(tt)) { res$ttErr <- TRUE; return(res) }
  T <- tt$tt
  res$ttidx <- arr(as.numeric(rownames(T)))
  res$tt <- lapply(seq_len(nrow(T)), function(i) list(n=as.numeric(T$n[i]), incl=suppressWarnings(as.numeric(T$incl[i])), pri=suppressWarnings(as.numeric(T$PRI[i])), out=as.character(T$OUT[i])))
  Yv <- if (neg) 1-d[[outc]] else d[[outc]]
  nec <- pof(d[,conds,drop=FALSE], Yv, relation="necessity")$incl.cov
  necn <- pof(1-d[,conds,drop=FALSE], Yv, relation="necessity")$incl.cov
  res$nec <- lapply(seq_along(conds), function(j) list(c=conds[j], pos=list(cons=nec$inclN[j], cov=nec$covN[j], ron=nec$RoN[j]), neg=list(cons=necn$inclN[j], cov=necn$covN[j], ron=necn$RoN[j])))
  pk <- function(sol, ic){ if (is.null(ic$incl.cov)) ic <- ic$individual[[1]]
    ic2 <- ic$incl.cov; list(terms=lapply(seq_len(nrow(ic2)), function(i) list(t=rownames(ic2)[i], incl=ic2$inclS[i], cov=ic2$covS[i], ucov=ic2$covU[i])),
      sol=list(incl=ic$sol.incl.cov$inclS[1], cov=ic$sol.incl.cov$covS[1])) }
  cx <- tryCatch(minimize(tt, details=TRUE), error=function(e) NULL)
  if (!is.null(cx)) {
    res$complex <- lapply(cx$solution, function(v) arr(sort(v)))
    res$complexFirst <- pk(cx$solution, cx$IC)
    ps <- tryCatch(minimize(tt, include="?", details=TRUE), error=function(e) NULL)
    if (is.null(ps)) { res$parsErr <- TRUE; return(res) }
    res$pars <- lapply(ps$solution, function(v) arr(sort(v)))
    res$parsFirst <- pk(ps$solution, ps$IC)
    de <- c(); for (j in seq_along(conds)) { if (dir[j]=="1") de <- c(de, conds[j]); if (dir[j]=="0") de <- c(de, paste0("~",conds[j])) }
    if (length(cx$solution)*length(ps$solution) > 40) { res$interSkipped <- length(cx$solution)*length(ps$solution); return(res) }
    it <- tryCatch(if (length(de)) minimize(tt, include="?", dir.exp=paste(de,collapse=","), details=TRUE) else minimize(tt, include="?", dir.exp=paste(paste0(conds,"[0,1]"),collapse=","), details=TRUE), error=function(e) e)
    if (inherits(it,"error")) res$interErr <- conditionMessage(it) else {
      res$interNames <- arr(names(it$i.sol))
      res$inter <- pk(it$i.sol[[1]]$solution, it$i.sol[[1]]$IC)
      res$interAll <- lapply(it$i.sol, function(z) lapply(z$solution, function(v) arr(sort(v))))
    }
  }
  res
}
for (row in seq_len(nrow(man))) { s <- man[row,]; if (file.exists(sprintf("r/%d.json", as.integer(s$id)))) next
  setTimeLimit(elapsed=40, transient=TRUE)
  res <- tryCatch(run_case(s), error=function(e) list(id=as.integer(s$id), fatal=conditionMessage(e)))
  setTimeLimit(elapsed=Inf)
  writeLines(toj(res), sprintf("r/%d.json", as.integer(s$id))) }
cat("r done\n")
